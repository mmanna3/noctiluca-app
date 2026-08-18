import { ItemObjetivoDTO, TipoListaObjetivoEnum } from "@/api/clients";
import { Input } from "@/components/ui/input-ui";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import PuntoMarcador from "@/components/ui/punto-marcador";
import { claveDeItem } from "@/sync/lecturas-core";
import { useListaObjetivos } from "@/sync/lecturas";
import {
	crearItemObjetivoLocal,
	editarItemObjetivoLocal,
	eliminarItemObjetivoLocal,
	reordenarItemsObjetivoLocal,
	toggleItemObjetivoLocal,
} from "@/sync/repositorio-objetivos";
import { esClaveDiaFutura } from "@/utils/objetivos";
import { useState } from "react";
import { Text, TextInput, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface Props {
	tipo: TipoListaObjetivoEnum;
	clavePeriodo: string;
	titulo?: string;
}

/**
 * Editor de una lista de objetivos (día/semana/mes) para un período dado.
 * Puerto RN de `noctiluca-fe/src/pantallas/objetivos/editor-lista-objetivos.tsx`:
 * sin drag-and-drop (dnd-kit es web-only) — reordenar es con botones ↑/↓.
 */
export default function EditorListaObjetivos({ tipo, clavePeriodo, titulo }: Props) {
	const data = useListaObjetivos(tipo, clavePeriodo);
	const [nuevoTexto, setNuevoTexto] = useState("");
	const [creando, setCreando] = useState(false);

	const items = data?.items ?? [];
	const soloLecturaCompletado = tipo === TipoListaObjetivoEnum._1 && esClaveDiaFutura(clavePeriodo);

	const agregar = async () => {
		if (!nuevoTexto.trim() || creando) return;
		setCreando(true);
		await crearItemObjetivoLocal({ listaTipo: tipo, listaClavePeriodo: clavePeriodo, texto: nuevoTexto.trim() });
		setNuevoTexto("");
		setCreando(false);
	};

	const moverItem = async (indice: number, direccion: -1 | 1) => {
		const destino = indice + direccion;
		if (destino < 0 || destino >= items.length) return;
		const copia = [...items];
		[copia[indice], copia[destino]] = [copia[destino], copia[indice]];
		await reordenarItemsObjetivoLocal(copia.map((item, i) => ({ clientId: claveDeItem(item), posicion: i })));
	};

	return (
		<View className="mb-4 pb-4 border-b border-gray-100">
			{titulo && <Text className="text-sm font-semibold text-slate-800 mb-2">{titulo}</Text>}
			{data === undefined ? (
				<View className="py-2 items-center">
					<LoadingSpinner />
				</View>
			) : (
				items.map((item, indice) => (
					<FilaObjetivo
						key={claveDeItem(item)}
						item={item}
						soloLecturaCompletado={soloLecturaCompletado}
						puedeSubir={indice > 0}
						puedeBajar={indice < items.length - 1}
						onSubir={() => void moverItem(indice, -1)}
						onBajar={() => void moverItem(indice, 1)}
					/>
				))
			)}
			<View className="flex-row items-center gap-2 mt-2">
				<View className="flex-1">
					<Input value={nuevoTexto} onChange={setNuevoTexto} placeholder="Agregar objetivo…" />
				</View>
				<TouchableOpacity
					onPress={agregar}
					disabled={creando}
					className="bg-slate-900 rounded-full h-10 w-10 items-center justify-center"
				>
					{creando ? <LoadingSpinner /> : <Ionicons name="add" size={22} color="white" />}
				</TouchableOpacity>
			</View>
		</View>
	);
}

interface FilaObjetivoProps {
	item: ItemObjetivoDTO;
	soloLecturaCompletado: boolean;
	puedeSubir: boolean;
	puedeBajar: boolean;
	onSubir: () => void;
	onBajar: () => void;
}

function FilaObjetivo({ item, soloLecturaCompletado, puedeSubir, puedeBajar, onSubir, onBajar }: FilaObjetivoProps) {
	const clientId = claveDeItem(item);
	const [editando, setEditando] = useState(false);
	const [texto, setTexto] = useState(item.texto ?? "");

	const guardarTexto = async () => {
		setEditando(false);
		const limpio = texto.trim();
		if (!limpio || limpio === item.texto) {
			setTexto(item.texto ?? "");
			return;
		}
		await editarItemObjetivoLocal(clientId, limpio);
	};

	return (
		<View className="flex-row items-center py-2 border-b border-gray-50 gap-2">
			<PuntoMarcador
				marcado={item.completado ?? false}
				disabled={soloLecturaCompletado}
				onClick={() => void toggleItemObjetivoLocal(clientId)}
			/>
			{editando ? (
				<TextInput
					value={texto}
					onChangeText={setTexto}
					onBlur={() => void guardarTexto()}
					onSubmitEditing={() => void guardarTexto()}
					autoFocus
					className="flex-1 text-sm text-slate-900 py-0"
				/>
			) : (
				<TouchableOpacity className="flex-1" onPress={() => setEditando(true)}>
					<Text className={`text-sm ${item.completado ? "line-through text-gray-400" : "text-slate-900"}`}>
						{item.texto}
					</Text>
				</TouchableOpacity>
			)}
			<View className="flex-row items-center">
				<TouchableOpacity onPress={onSubir} disabled={!puedeSubir} className="p-1" style={{ opacity: puedeSubir ? 1 : 0.25 }}>
					<Ionicons name="chevron-up" size={16} color="#64748b" />
				</TouchableOpacity>
				<TouchableOpacity onPress={onBajar} disabled={!puedeBajar} className="p-1" style={{ opacity: puedeBajar ? 1 : 0.25 }}>
					<Ionicons name="chevron-down" size={16} color="#64748b" />
				</TouchableOpacity>
			</View>
			<TouchableOpacity onPress={() => void eliminarItemObjetivoLocal(clientId)} className="p-1">
				<Ionicons name="trash-outline" size={16} color="#94a3b8" />
			</TouchableOpacity>
		</View>
	);
}
