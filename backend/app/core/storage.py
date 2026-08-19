"""
MinIO (S3-compatible) client wrapper.

Generates presigned URLs so uploads/downloads go directly between the
browser and MinIO — never through the API server's memory
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
    endpoint_url=f"http://{settings.minio_endpoint}",
    aws_access_key_id=settings.minio_access_key,
    aws_secret_access_key=settings.minio_secret_key,
    config=BotoConfig(signature_version="s3v4"),
    region_name="us-east-1",
)


def ensure_bucket_exists() -> None:
    existing = [b["Name"] for b in _s3.list_buckets().get("Buckets", [])]
    if settings.minio_bucket not in existing:
        _s3.create_bucket(Bucket=settings.minio_bucket)

    # Allow the browser (running on localhost:3000) to PUT directly to
    # MinIO (localhost:9000) using a presigned URL — without this, the
    # browser's CORS preflight will be rejected.
    try:
        _s3.put_bucket_cors(
            Bucket=settings.minio_bucket,
            CORSConfiguration={
                "CORSRules": [
                    {
                        "AllowedOrigins": ["*"],
                        "AllowedMethods": ["GET", "PUT", "POST"],
                        "AllowedHeaders": ["*"],
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
        Params={"Bucket": settings.minio_bucket, "Key": object_key},
        ExpiresIn=expires_in,
    )


def generate_download_url(object_key: str, expires_in: int = 900) -> str:
    return _s3.generate_presigned_url(
        "get_object",
        Params={"Bucket": settings.minio_bucket, "Key": object_key},
        ExpiresIn=expires_in,
    )

def download_file(object_key: str) -> bytes:
    obj = _s3.get_object(Bucket=settings.minio_bucket, Key=object_key)
    return obj["Body"].read()
