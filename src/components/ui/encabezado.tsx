import { ReactNode } from "react";
import { View } from "react-native";

interface Props {
	children: ReactNode;
}

const Encabezado = (props: Props) => {
	return (
		<View className="flex-row justify-between w-full">
			{props.children}
		</View>
	);
};

export default Encabezado;
