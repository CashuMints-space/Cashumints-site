import { Toaster as Sonner } from "sonner"

type ToasterProps = React.ComponentProps<typeof Sonner>

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      theme="dark"
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-gray-800 group-[.toaster]:text-white group-[.toaster]:border-gray-700 group-[.toaster]:shadow-lg",
          description: "group-[.toast]:text-gray-400",
          actionButton:
            "group-[.toast]:bg-[#f5a623] group-[.toast]:text-black",
          cancelButton:
            "group-[.toast]:bg-gray-700 group-[.toast]:text-gray-300",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }