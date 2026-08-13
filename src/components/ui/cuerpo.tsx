import { ReactNode } from "react";
import { View } from "react-native";

interface Props {
	children: ReactNode;
	className?: string;
}

const Cuerpo = ({ children, className }: Props) => {
	return (
		<View className={`mt-6 mb-4 ${className ?? ""}`.trim()}>
			{children}
		</View>
	);
};

export default Cuerpo;
