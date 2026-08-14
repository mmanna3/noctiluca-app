import { api } from "@/api/api";
import { HabitoDTO, TipoHabitoEnum } from "@/api/clients";
import { clavesHabitos, queryKeys } from "@/api/query-keys";
import useApiQuery from "@/api/custom-hooks/use-api-query";
import useApiMutation from "@/api/custom-hooks/use-api-mutation";
import { Boton, BotonIcono } from "@/components/ui/botones";
import Cuerpo from "@/components/ui/cuerpo";
import Encabezado from "@/components/ui/encabezado";
import { Input } from "@/components/ui/input-ui";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import useNavegacion from "@/use-navegacion";
import { esHabitoNumerico, MAX_HABITOS_ACTIVOS } from "@/pantallas/habitos/utilidades-habitos";
import { validarHabito } from "@/utils/validar-habito";
import { useState } from "react";
import { FlatList, Switch, Text, TextInput, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Toast from "react-native-toast-message";

interface FormularioProps {
	habitoInicial?: HabitoDTO;
	onCancelar: () => void;
	onGuardado: () => void;
}

export { validarHabito };

function FormularioHabito({ habitoInicial, onCancelar, onGuardado }: FormularioProps) {
	const [nombre, setNombre] = useState(habitoInicial?.nombre ?? "");
	const [tipo, setTipo] = useState<TipoHabitoEnum>(habitoInicial?.tipo ?? TipoHabitoEnum._1);
	const [metaMinutos, setMetaMinutos] = useState(String(habitoInicial?.metaMinutos ?? 30));
	const [activo, setActivo] = useState(habitoInicial?.activo ?? true);
	const [error, setError] = useState("");

	const esEdicion = (habitoInicial?.id ?? 0) > 0;
	const numerico = esHabitoNumerico(tipo);

	const { mutate, isPending } = useApiMutation({
		fn: async () => {
			const dto = new HabitoDTO({
				id: habitoInicial?.id ?? 0,
				nombre: nombre.trim(),
				tipo,
				activo,
				posicion: habitoInicial?.posicion ?? 0,
				metaMinutos: numerico ? (parseInt(metaMinutos, 10) || 1) : undefined,
			});
			if (esEdicion) {
				await api.habitoPUT(habitoInicial!.id!, dto);
			} else {
				await api.habitoPOST(dto);
			}
		},
		mensajeDeExito: esEdicion ? "Hábito actualizado" : "Hábito creado",
		antesDeMensajeExito: onGuardado,
		invalidarQueries: clavesHabitos,
	});

	const submit = () => {
		const mensajeError = validarHabito(nombre);
		if (mensajeError) {
			setError(mensajeError);
			return;
		}
		mutate(undefined as never);
	};

	return (
		<View className="border border-gray-200 rounded-lg p-4 mb-4 gap-3">
			<Input
				value={nombre}
				onChange={(v) => { setNombre(v); setError(""); }}
				placeholder="Nombre del hábito"
			/>
			{!!error && <Text className="text-xs text-red-500">{error}</Text>}

			<View>
				<Text className="text-xs text-gray-500 mb-1">Tipo</Text>
				<View className="flex-row gap-3">
					<TouchableOpacity
						onPress={() => setTipo(TipoHabitoEnum._1)}
						className={`flex-1 border rounded-md py-2 items-center ${tipo === TipoHabitoEnum._1 ? "border-slate-900 bg-slate-900" : "border-gray-200"}`}
					>
						<Text className={tipo === TipoHabitoEnum._1 ? "text-white text-sm" : "text-slate-900 text-sm"}>Sí / No</Text>
					</TouchableOpacity>
					<TouchableOpacity
						onPress={() => setTipo(TipoHabitoEnum._2)}
						className={`flex-1 border rounded-md py-2 items-center ${tipo === TipoHabitoEnum._2 ? "border-slate-900 bg-slate-900" : "border-gray-200"}`}
					>
						<Text className={tipo === TipoHabitoEnum._2 ? "text-white text-sm" : "text-slate-900 text-sm"}>Numérico</Text>
					</TouchableOpacity>
				</View>
			</View>

			{numerico && (
				<View>
					<Text className="text-xs text-gray-500 mb-1">Meta diaria (minutos)</Text>
					<TextInput
						value={metaMinutos}
						onChangeText={setMetaMinutos}
						keyboardType="numeric"
						className="border-b border-gray-300 py-2 text-base text-slate-900"
					/>
				</View>
			)}

			<View className="flex-row items-center justify-between">
				<Text className="text-sm text-slate-900">Activo</Text>
				<Switch value={activo} onValueChange={setActivo} />
			</View>

			<View className="flex-row gap-2">
				<TouchableOpacity
					onPress={submit}
					disabled={isPending}
					className="flex-1 bg-slate-900 rounded-md py-2 items-center"
				>
					{isPending ? <LoadingSpinner /> : <Text className="text-white text-sm">{esEdicion ? "Guardar" : "Crear"}</Text>}
				</TouchableOpacity>
				<TouchableOpacity
					onPress={onCancelar}
					className="flex-1 border border-gray-300 rounded-md py-2 items-center"
				>
					<Text className="text-sm text-slate-900">Cancelar</Text>
				</TouchableOpacity>
			</View>
		</View>
	);
}

export default function AdministrarHabitos() {
	const { irAlInicio } = useNavegacion();
	const [mostrarFormulario, setMostrarFormulario] = useState(false);
	const [habitoEditando, setHabitoEditando] = useState<HabitoDTO | undefined>();

	const { data, isLoading } = useApiQuery({
		key: queryKeys.habitos,
		fn: () => api.habitoAll(),
	});

	const { mutate: eliminar } = useApiMutation({
		fn: (id: number) => api.habitoDELETE(id),
		mensajeDeExito: "Hábito eliminado",
		invalidarQueries: clavesHabitos,
	});

	const { mutate: desactivar } = useApiMutation({
		fn: async (habito: HabitoDTO) => {
			await api.habitoPUT(habito.id!, new HabitoDTO({
				id: habito.id,
				nombre: habito.nombre,
				tipo: habito.tipo,
				activo: false,
				posicion: habito.posicion,
				metaMinutos: habito.metaMinutos,
			}));
		},
		mensajeDeExito: "Hábito desactivado",
		invalidarQueries: clavesHabitos,
	});

	const alGuardar = () => {
		setMostrarFormulario(false);
		setHabitoEditando(undefined);
	};

	const habitosActivos = data?.filter((h) => h.activo).length ?? 0;
	const puedeCrearActivo = habitosActivos < MAX_HABITOS_ACTIVOS;

	if (isLoading) {
		return (
			<View className="flex-1 justify-center items-center">
				<LoadingSpinner />
			</View>
		);
	}

	return (
		<View className="flex-1">
			<Encabezado>
				<Boton soloBorde onClick={irAlInicio}>
					<Ionicons name="chevron-back" size={16} color="#0f172a" />
					Hábitos
				</Boton>
				<BotonIcono onClick={() => { setHabitoEditando(undefined); setMostrarFormulario(true); }}>
					<Ionicons name="add" size={28} color="white" />
				</BotonIcono>
			</Encabezado>
			<Cuerpo className="flex-1">
				<Text className="text-xs text-gray-500 mb-3">
					{habitosActivos}/{MAX_HABITOS_ACTIVOS} hábitos activos
					{!puedeCrearActivo && " (límite alcanzado)"}
				</Text>

				{(mostrarFormulario || habitoEditando) && (
					<FormularioHabito
						habitoInicial={habitoEditando}
						onCancelar={() => { setMostrarFormulario(false); setHabitoEditando(undefined); }}
						onGuardado={alGuardar}
					/>
				)}

				<FlatList
					data={data ?? []}
					keyExtractor={(h) => String(h.id)}
					renderItem={({ item: habito }) => {
						const tieneRegistros = (habito.cantidadRegistros ?? 0) > 0;
						const tipoLabel = esHabitoNumerico(habito.tipo) ? "Numérico" : "Sí/No";
						return (
							<View className={`border rounded-lg p-3 mb-3 ${habito.activo ? "border-gray-200" : "border-gray-100 bg-gray-50 opacity-70"}`}>
								<View className="flex-row justify-between items-start">
									<View className="flex-1">
										<Text className="text-sm font-medium text-slate-900">{habito.nombre}</Text>
										<Text className="text-xs text-gray-500">
											{tipoLabel}
											{esHabitoNumerico(habito.tipo) && ` · meta ${habito.metaMinutos ?? 1} min`}
											{!habito.activo && " · inactivo"}
										</Text>
									</View>
									<View className="flex-row gap-1 items-center">
										<TouchableOpacity
											onPress={() => { setHabitoEditando(habito); setMostrarFormulario(false); }}
											className="px-2 py-1"
										>
											<Text className="text-xs text-gray-600">Editar</Text>
										</TouchableOpacity>
										{habito.activo && (
											<TouchableOpacity
												onPress={() => desactivar(habito)}
												className="px-2 py-1"
											>
												<Text className="text-xs text-amber-600">Desactivar</Text>
											</TouchableOpacity>
										)}
										<TouchableOpacity
											onPress={() => {
												if (tieneRegistros) {
													Toast.show({ type: "error", text1: "No se puede eliminar un hábito con registros" });
													return;
												}
												if (habito.id) eliminar(habito.id);
											}}
											className="p-1"
										>
											<Ionicons name="trash-outline" size={16} color={tieneRegistros ? "#d1d5db" : "#ef4444"} />
										</TouchableOpacity>
									</View>
								</View>
							</View>
						);
					}}
				/>
			</Cuerpo>
		</View>
	);
}
