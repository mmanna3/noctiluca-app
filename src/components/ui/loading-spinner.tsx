import { ActivityIndicator } from "react-native";

interface LoadingSpinnerProps {
	className?: string;
}

export const LoadingSpinner = ({ className = "" }: LoadingSpinnerProps) => {
	return <ActivityIndicator size="small" color="#0f172a" className={className} />;
};
