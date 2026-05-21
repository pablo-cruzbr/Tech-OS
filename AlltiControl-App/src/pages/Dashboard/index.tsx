import React, { useContext, useEffect, useState } from "react";
import {
  View,
  Text,
  SafeAreaView,
  TouchableOpacity,
  FlatList,
  Image,
  StyleSheet,
  Modal,
  ActivityIndicator,
  TextInput,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Feather from "@expo/vector-icons/Feather";
import SimpleLineIcons from '@expo/vector-icons/SimpleLineIcons';
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { Picker } from "@react-native-picker/picker";
import { AuthContext } from "../../contexts/AuthContext";
import { api } from "../../services/api";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ModalDetailOrder } from "../../components/modalDetailOrder";
import { useNavigation } from "@react-navigation/native";

export type OrdensDeServico = {
  id: string;
  name: string;
  descricaodoProblemaouSolicitacao: string;
  nomedoContatoaserProcuradonoLocal: string;
  created_at: string;
  nameTecnico: string | null;
  diagnostico: string | null;
  solucao: string | null;
  bannerassinatura: string | null;
  assinante: string | null;
  numeroOS: number;
  startedAt?: string | null;
  endedAt?: string | null;
  duracao?: number;
  informacoesSetor?: {
    id: string;
    usuario: string;
    ramal: string;
    andar: string;
    setor: { id: string; name: string };
    instituicaoUnidade: { id: string; name: string };
    cliente: { id: string; name: string };
  } | null;
  user: {
    id: string;
    name: string;
    instituicaoUnidade: { name: string; endereco: string } | null;
    cliente: {id: string; name: string; endereco: string } | null;
    setor: { name: string } | null;
  };
  tipodeOrdemdeServico: { id: string; name: string } | null;
  tipodeChamado: {id: string; name: string | null};
  cliente: { id: string; name: string; endereco: string, cnpj: string | null } | null;
  tecnico: { id: string; name: string } | null;
  instituicaoUnidade: { id: string; name: string; endereco: string } | null;
  statusOrdemdeServico: { id: string; name: string} | null;
};

type Instituicao = { id: string; name: string };
type Cliente = { id: string; name: string };
type TipodeOrdem = {id: string; name: string};

export default function Dashboard() {
  const navigation = useNavigation();
  const { signOut } = useContext(AuthContext);

  const [ordensDeServico, setOrdensDeServico] = useState<OrdensDeServico[]>([]);
  const [filteredOrdens, setFilteredOrdens] = useState<OrdensDeServico[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [instituicaoFilter, setInstituicaoFilter] = useState<string>("");
  const [clienteFilter, setClienteFilter] = useState<string>("");
  const [instituicoes, setInstituicoes] = useState<Instituicao[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [modalOsDetailVisible, setModalOsVisible] = useState(false);
  const [selectedOrdem, setSelectedOrdem] = useState<OrdensDeServico | null>(null);
  const [loading, setLoading] = useState(false);
  const [tiposOrdem, setTiposOrdem] = useState<TipodeOrdem[]>([]);
  const [tipoOrdemFilter, setTipoOrdemFilter] = useState<string>("");

  const statusList = [
    { id: "all", name: "TODOS" },
    { id: "80e14fbe-c7fd-45bc-b3cd-cfa51ede44e0", name: "ABERTA" },
    { id: "ce3a8414-704c-4562-bb3d-b400fe9f3b6b", name: "EM ANDAMENTO" },
    { id: "fa69ed32-20b2-4d3a-9a6d-e61c5b45efea", name: "CONCLUIDA" },
    { id: "f5341cb0-e6e1-4a5a-b5fc-c55386e55222", name: "PAUSADA" },
  ];

const loadOrdens = async () => {
  setLoading(true);
  try {
    const storageToken = await AsyncStorage.getItem("@AlltiService");
    if (!storageToken) return;

    const { token } = JSON.parse(storageToken);
    if (!token) return;

    const response = await api.get("/listordemdeservico", {
      headers: { Authorization: `Bearer ${token}` },
    });

    console.log("QTD DE ORDENS RECEBIDAS:", response.data.controles?.length);
console.log("DADOS COMPLETOS:", JSON.stringify(response.data.controles, null, 2));

    const ordens = response.data.controles || []; 
    
    setOrdensDeServico(ordens);
    setFilteredOrdens(ordens);
    console.log("QTD FINAL NA LISTA:", filteredOrdens.length);
  } catch (error) {
    console.error("Erro ao carregar ordens de serviço:", error);
  } finally {
    setLoading(false);
  }
};

  // Carrega filtros de instituição e cliente
  const loadFilters = async () => {
    try {
      const storageToken = await AsyncStorage.getItem("@AlltiService");
      if (!storageToken) return;

      const { token } = JSON.parse(storageToken);
      if (!token) return;

      // Instituições
      const instResponse = await api.get("/listinstuicao", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const instList = instResponse.data.instituicoes || [];
      setInstituicoes(instList.map((inst: any) => ({ id: inst.id, name: inst.name })));

      // Clientes
      const cliResponse = await api.get("/listcliente", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const cliList = cliResponse.data.controles || [];
      setClientes(cliList.map((cli: any) => ({ id: cli.id, name: cli.name })));

      const tipoResponse = await api.get("/listtipodeordemdeservico", {
        headers: {},
      });

      const tipoList = tipoResponse.data || [];

      setTiposOrdem(
        tipoList.map((tipo: any) => ({ id: tipo.id, name: tipo.name }))
      );

    } catch (error) {
      console.error("Erro ao carregar filtros:", error);
    }
  };

  // Filtragem
  useEffect(() => {
    let result = [...ordensDeServico];

    // Pesquisa
    if (search.trim()) {
      const lower = search.toLowerCase();
      result = result.filter(
        (os) =>
          os.numeroOS?.toString().includes(lower) ||
          os.instituicaoUnidade?.name?.toLowerCase().includes(lower) ||
          os.user?.cliente?.name?.toLowerCase().includes(lower)
      );
    }

  
    if (statusFilter && statusFilter !== "TODOS") {
      result = result.filter((os) => os.statusOrdemdeServico?.name === statusFilter);
    }

   
    if (instituicaoFilter) {
      result = result.filter(
        (os) => os.instituicaoUnidade?.id === instituicaoFilter
      );
    }

   
    if (clienteFilter) {
      result = result.filter(
        (os) => os.user?.cliente?.id === clienteFilter || os.cliente?.id === clienteFilter
      );
    }

    if (tipoOrdemFilter) {
      result = result.filter(
        (os) => os.tipodeOrdemdeServico?.id === tipoOrdemFilter
      );
    }


    setFilteredOrdens(result);
  }, [search, statusFilter, instituicaoFilter, clienteFilter, ordensDeServico, tipoOrdemFilter]);

 
  useEffect(() => {
    loadOrdens();
    loadFilters();
  }, []);

  return (
    <SafeAreaView style={styles.container}>
  
      <View style={styles.header}>
        <Image source={require("../../assets/logoperfil2.png")} style={styles.profileImage} />
        <Text style={styles.title}>Ordens de Serviço</Text>
        <View style={styles.headerIcons}>
          <SimpleLineIcons name="logout" size={20} color="#fff" style={styles.icon} onPress={signOut}/>
          <Feather name="user" size={24} color="#fff" style={styles.icon} />
          {loading ? (
            <ActivityIndicator size="small" color="#fff" style={styles.icon} />
          ) : (
            <Ionicons
              name="refresh"
              size={22}
              color="#fff"
              style={styles.icon}
              onPress={loadOrdens}
            />
          )}
        </View>
      </View>

    
      <TextInput
        style={styles.input}
        placeholder="Pesquisar por número da OS, Instituição ou Empresa"
        value={search}
        onChangeText={setSearch}
      />

    
  <Picker
    selectedValue={tipoOrdemFilter}
      style={styles.picker}
      onValueChange={(value) => setTipoOrdemFilter(value)}
    >
      <Picker.Item label="Todos Tipos de OS" value="" />
      {tiposOrdem.map((tipo) => (
        <Picker.Item key={tipo.id} label={tipo.name} value={tipo.id} />
      ))}
    </Picker>

      <Picker
        selectedValue={instituicaoFilter}
        style={styles.picker}
        onValueChange={(value) => setInstituicaoFilter(value)}
      >
        <Picker.Item label="Todas Instituições" value="" />
        {instituicoes.map((inst) => (
          <Picker.Item key={inst.id} label={inst.name} value={inst.id} />
        ))}
      </Picker>

      <Picker
        selectedValue={clienteFilter}
        style={styles.picker}
        onValueChange={(value) => setClienteFilter(value)}
      >
        <Picker.Item label="Todos Clientes" value="" />
        {clientes.map((cli) => (
          <Picker.Item key={cli.id} label={cli.name} value={cli.id} />
        ))}
      </Picker>
     
      <View style={styles.statusRow}>
        {statusList.map((status) => {
          const active =
            statusFilter === status.name || (status.id === "all" && statusFilter === "");
          return (
            <TouchableOpacity
              key={status.id}
              style={[styles.statusButton, active && styles.statusButtonActive]}
              onPress={() => setStatusFilter(status.id === "all" ? "" : status.name)}
            >
              <Text style={[styles.statusText, active && styles.statusTextActive]}>
                {status.name}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

     
  
      <FlatList
        data={filteredOrdens}
        keyExtractor={(item) => item.id}
       renderItem={({ item }) => (
  <TouchableOpacity
    style={styles.card}
    onPress={() => {
      setSelectedOrdem(item);
      setModalOsVisible(true);
    }}
  >
    <View style={styles.cardInfo}>
      <Text style={styles.cardTitle}>
        Número da OS: {item?.numeroOS ?? "N/A"}
      </Text>
      
      <Text style={styles.cardStatus}>
        Status: {item?.statusOrdemdeServico?.name ?? "Não definido"}
      </Text>

      {/* Uso de Optional Chaining (?.) e Operador de Coalescência (??) */}
      {item?.cliente?.name && (
        <Text style={styles.cardSubtitle}>
          Empresa: {item.cliente.name}
        </Text>
      )}
      
      {item?.cliente?.endereco && (
        <Text style={styles.cardSubtitle}>
          Endereço: {item.cliente.endereco}
        </Text>
      )}

      {item?.instituicaoUnidade?.name && (
        <Text style={styles.cardSubtitle}>
          Instituição: {item.instituicaoUnidade.name}
        </Text>
      )}

      <Text style={styles.cardItem}>
        Problema: {item?.descricaodoProblemaouSolicitacao || "Sem descrição"}
      </Text>
      
      <Text style={styles.cardItem}>
        Contato: {item?.nomedoContatoaserProcuradonoLocal || "Não informado"}
      </Text>
    </View>
    
    <Ionicons name="ellipsis-vertical" size={20} color="#333" />
  </TouchableOpacity>
)}
        contentContainerStyle={{ paddingBottom: 90, paddingTop: 10 }}
      />

     
      <Modal
        transparent
        visible={modalOsDetailVisible}
        animationType="slide"
        onRequestClose={() => setModalOsVisible(false)}
      >
        <ModalDetailOrder
          ordem={selectedOrdem}
          handleCloseModal={() => setModalOsVisible(false)}
        />
      </Modal>

     
      <TouchableOpacity style={styles.fabSecondary} onPress={signOut}>
        <Feather name="log-in" size={28} color="#fff" />
      </TouchableOpacity>

       <TouchableOpacity
        style={styles.fabSecondary}
        onPress={() => navigation.navigate("ListOrdemdeServicoInterna" as never)}
        activeOpacity={0.7}
      >
        <MaterialCommunityIcons name="form-select" size={30} color="#fff" />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8F8F8" },
  header: {
    backgroundColor: "#4E3182",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 15,
    paddingTop: 40,
    paddingBottom: 20,
  },
  profileImage: { width: 35, height: 35, borderRadius: 50 },
  title: { color: "#fff", fontSize: 20, fontWeight: "700", flex: 1, textAlign: "center" },
  headerIcons: { flexDirection: "row", alignItems: "center" },
  icon: { marginLeft: 15 },
  input: {
    marginHorizontal: 10,
    marginTop: 10,
    marginBottom: 5,
    padding: 10,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    backgroundColor: "#fff",
  },
  filterRow: { flexDirection: "row", marginHorizontal: 10, marginBottom: 10 },
  picker: {
    height: 60,
  width: "100%",
  backgroundColor: "#fff",
  borderRadius: 8,
  marginBottom: 10,
  },
  statusRow: { flexDirection: "row", paddingHorizontal: 10, marginBottom: 10, flexWrap: "wrap" },
  statusButton: {
    width: 100,
    height: 30,
    backgroundColor: "#eee",
    borderRadius: 20,
    marginRight: 7,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
  },
  statusButtonActive: { backgroundColor: "#4E3182" },
  statusText: { fontSize: 11, color: "#333", fontWeight: "600" },
  statusTextActive: { color: "#fff" },
  card: {
    flexDirection: "row",
    backgroundColor: "#fff",
    marginHorizontal: 10,
    marginTop: 9,
    padding: 20,
    borderRadius: 8,
    alignItems: "center",
    elevation: 2,
  },
  cardInfo: { flex: 1 },
  cardTitle: { fontWeight: "bold", fontSize: 14 },
  cardStatus: { fontWeight: "bold", fontSize: 14, marginTop: 4 },
  cardSubtitle: { fontSize: 12, color: "#666" },
  cardItem: { fontSize: 12, color: "#333" },
  fab: {
    position: "absolute",
    bottom: 120,
    right: 20,
    backgroundColor: "#4E3182",
    width: 55,
    height: 55,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    elevation: 6,
    zIndex: 99,
  },
  fabSecondary: {
    position: "absolute",
    bottom: 50,
    right: 20,
    backgroundColor: "#4E3182",
    width: 55,
    height: 55,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    elevation: 4,
  },
});
