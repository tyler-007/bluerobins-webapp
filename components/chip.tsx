export default function Chip(props: { children: React.ReactNode }) {
  return (
    <div className="text text-black bg-[#F0F0F0A6] px-4 py-2 rounded-full border border-[#0000001A]">
      {props.children}
    </div>
  );
}
