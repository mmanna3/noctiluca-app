import { TextInput } from "react-native";

interface InputProps {
	id?: string;
	type?: "text" | "password" | "email" | "number";
	value: string;
	onChange: (value: string) => void;
	placeholder?: string;
	required?: boolean;
	disabled?: boolean;
	className?: string;
}

export const Input = ({
	type = "text",
	value,
	onChange,
	placeholder,
	disabled = false,
	className = "",
}: InputProps) => {
	return (
		<TextInput
			value={value}
			onChangeText={onChange}
			placeholder={placeholder}
			secureTextEntry={type === "password"}
			keyboardType={type === "email" ? "email-address" : type === "number" ? "numeric" : "default"}
			editable={!disabled}
			className={`border-b border-slate-900 text-slate-900 w-full text-lg px-2 py-2 font-medium ${disabled ? "opacity-50" : ""} ${className}`}
		/>
	);
};
