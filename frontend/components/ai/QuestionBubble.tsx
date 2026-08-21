export function QuestionBubble({ text }: { text: string }) {
  return (
    <div
      className="self-end max-w-[80%] rounded-[14px_14px_4px_14px] px-4 py-3 text-[14px] leading-[1.5] text-white shadow-[var(--sh-accent)] bg-[image:var(--grad)]"
      style={{ animation: "om-rise .4s cubic-bezier(.2,.7,.2,1) both" }}
    >
      {text}
    </div>
  );
}
