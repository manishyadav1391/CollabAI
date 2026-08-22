"""
S3-compatible object storage client wrapper (MinIO locally, Backblaze B2 in
prod — same API, only the endpoint/credentials in Settings change).

Generates presigned URLs so uploads/downloads go directly between the
browser and the storage backend — never through the API server's memory
(docs/04-technical-architecture.md, FR-DOC-01).
"""

import logging
import boto3
from botocore.client import Config as BotoConfig
from botocore.exceptions import ClientError

from app.config import get_settings

settings = get_settings()

_s3 = boto3.client(
    "s3",
    endpoint_url=settings.storage_endpoint_url,
    aws_access_key_id=settings.storage_access_key_id,
    aws_secret_access_key=settings.storage_secret_access_key,
    config=BotoConfig(
        signature_version="s3v4",
        s3={"addressing_style": "path" if settings.storage_force_path_style else "virtual"},
    ),
    region_name=settings.storage_region,
)


def ensure_bucket_exists() -> None:
    # head_bucket (rather than list_buckets) so this also works with a
    # storage key scoped to just this one bucket — least-privilege prod
    # setups (e.g. a Backblaze B2 key restricted to this bucket) can't
    # list all buckets on the account.
    try:
        _s3.head_bucket(Bucket=settings.storage_bucket)
    except ClientError as e:
        if e.response.get("Error", {}).get("Code") in ("404", "NoSuchBucket"):
            _s3.create_bucket(Bucket=settings.storage_bucket)
        else:
            raise

    # Allow the browser (running on localhost:3000) to PUT directly to
    # the storage backend using a presigned URL — without this, the
    # browser's CORS preflight will be rejected.
    try:
        _s3.put_bucket_cors(
            Bucket=settings.storage_bucket,
            CORSConfiguration={
                "CORSRules": [
                    {
                        # "AllowedOrigins": ["*"],
                        "AllowedOrigins": [settings.frontend_base_url],
                        "AllowedMethods": ["GET", "PUT", "POST"],
                        "AllowedHeaders": ["*"],
                        # The browser needs to read the ETag response header
                        # off each part PUT to hand back to us for
                        # CompleteMultipartUpload (FR-DOC-05) — browsers
                        # hide response headers from cross-origin JS unless
                        # the server explicitly exposes them via CORS.
                        "ExposeHeaders": ["ETag"],
                    }
                ]
            },
        )
    except ClientError as e:
        if e.response.get("Error", {}).get("Code") == "NotImplemented":
            logger = logging.getLogger("collabai")
            logger.warning(
                "put_bucket_cors is not implemented by the storage provider. Skipping. "
                "If you encounter CORS issues in the browser, configure CORS on your storage server directly."
            )
        else:
            raise


def generate_upload_url(object_key: str, expires_in: int = 900) -> str:
    return _s3.generate_presigned_url(
        "put_object",
        Params={"Bucket": settings.storage_bucket, "Key": object_key},
        ExpiresIn=expires_in,
    )


def generate_download_url(object_key: str, expires_in: int = 900) -> str:
    return _s3.generate_presigned_url(
        "get_object",
        Params={"Bucket": settings.storage_bucket, "Key": object_key},
        ExpiresIn=expires_in,
    )

def download_file(object_key: str) -> bytes:
    obj = _s3.get_object(Bucket=settings.storage_bucket, Key=object_key)
    return obj["Body"].read()


# --- Multipart (chunked/resumable) upload — FR-DOC-05 ---
# Large files are split into parts on the client; each part is PUT directly
# to MinIO via its own presigned URL, same "never through the API server's
# memory" principle as the single-shot upload above.

def create_multipart_upload(object_key: str) -> str:
    resp = _s3.create_multipart_upload(Bucket=settings.storage_bucket, Key=object_key)
    return resp["UploadId"]


def generate_part_upload_url(object_key: str, upload_id: str, part_number: int, expires_in: int = 900) -> str:
    return _s3.generate_presigned_url(
        "upload_part",
        Params={
            "Bucket": settings.storage_bucket, "Key": object_key,
            "UploadId": upload_id, "PartNumber": part_number,
        },
        ExpiresIn=expires_in,
    )


def list_uploaded_parts(object_key: str, upload_id: str) -> list[dict]:
    """What MinIO already has for this upload — lets a client resume after
    a reload/crash without re-uploading parts that already landed."""
    parts = []
    paginator = _s3.get_paginator("list_parts")
    for page in paginator.paginate(Bucket=settings.storage_bucket, Key=object_key, UploadId=upload_id):
        parts.extend(page.get("Parts", []))
    return [{"part_number": p["PartNumber"], "etag": p["ETag"], "size_bytes": p["Size"]} for p in parts]


def complete_multipart_upload(object_key: str, upload_id: str, parts: list[dict]) -> None:
    _s3.complete_multipart_upload(
        Bucket=settings.storage_bucket, Key=object_key, UploadId=upload_id,
        MultipartUpload={"Parts": [{"PartNumber": p["part_number"], "ETag": p["etag"]} for p in parts]},
    )


def abort_multipart_upload(object_key: str, upload_id: str) -> None:
    _s3.abort_multipart_upload(Bucket=settings.storage_bucket, Key=object_key, UploadId=upload_id)
