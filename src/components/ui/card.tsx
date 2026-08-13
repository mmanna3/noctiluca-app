import { ReactNode } from "react";
import { View, Text } from "react-native";

interface CardProps {
	children: ReactNode;
	className?: string;
}

interface CardHeaderProps {
	children: ReactNode;
	className?: string;
}

interface CardTitleProps {
	children: ReactNode;
	className?: string;
}

interface CardContentProps {
	children: ReactNode;
	className?: string;
}

export const Card = ({ children, className = "" }: CardProps) => {
	return (
		<View className={`bg-white rounded-lg shadow border border-gray-200 ${className}`}>
			{children}
		</View>
	);
};

export const CardHeader = ({ children, className = "" }: CardHeaderProps) => {
	return <View className={`p-6 pb-0 ${className}`}>{children}</View>;
};

export const CardTitle = ({ children, className = "" }: CardTitleProps) => {
	return (
		<Text className={`text-xl font-semibold text-gray-900 ${className}`}>{children}</Text>
	);
};

export const CardContent = ({ children, className = "" }: CardContentProps) => {
	return <View className={`p-6 pt-4 ${className}`}>{children}</View>;
};
