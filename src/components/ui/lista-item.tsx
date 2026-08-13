import React from "react";
import { TouchableOpacity, Text, View } from "react-native";

interface IProps {
	titulo: string;
	subtitulo: string;
	fecha?: string;
	icono?: React.ReactNode;
	onClick: () => void;
}

function parseISOStringtoddMMyy(dateString: string) {
	const dateObj = new Date(dateString);
	const year = dateObj.getFullYear();
	const month = String(dateObj.getMonth() + 1).padStart(2, "0");
	const day = String(dateObj.getDate()).padStart(2, "0");
	return `${day}.${month}.${year.toString().slice(-2)}`;
}

const ListaItem = (props: IProps) => {
	return (
		<TouchableOpacity
			className="px-2 py-3 border-b border-gray-200"
			onPress={props.onClick}
		>
			{props.fecha && (
				<Text className="text-xs text-gray-400 pb-1">
					{parseISOStringtoddMMyy(props.fecha)}
				</Text>
			)}
			<View className="flex-row items-center gap-1.5">
				{props.icono}
				<Text className="text-base text-slate-900">{props.titulo}</Text>
			</View>
			<Text className="text-sm text-gray-500">{props.subtitulo}</Text>
		</TouchableOpacity>
	);
};

export default ListaItem;
