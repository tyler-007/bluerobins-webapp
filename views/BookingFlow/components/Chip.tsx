export default function Chip(props: {
  leftText: string;
  rightText?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex cursor-pointer rounded-md border-2 border-secondaryColor hover:bg-secondaryColor hover:text-white text-secondaryColor px-2 py-1 items-center justify-between">
      <span>{props.leftText}</span>
      {props.rightText && (
        <span className="text-base self-center px-3 py-1">
          {props.rightText}
        </span>
      )}
      {props.children}
    </div>
  );
}
