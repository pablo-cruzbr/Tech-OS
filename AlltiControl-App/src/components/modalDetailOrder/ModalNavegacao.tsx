import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Linking,
  Alert,
  Platform,
  Modal
} from "react-native";
import { ScrollComIndicador } from "../ScrollComIndicador";
import { OrdensDeServico } from "../../pages/Dashboard";
import { ModalDetailOrderFormTecnico } from "../modalDetailOrderFormTecnico";
import { MaterialIcons } from "@expo/vector-icons";
import { FontAwesome5 } from '@expo/vector-icons'; // Se usar Expo
// import FontAwesome5 from 'react-native-vector-icons/FontAwesome5'; // Se usar React Native CLI puro


const { width: WIDTH } = Dimensions.get("window");

interface ModalDetailOsProps {
  ordem: OrdensDeServico | null;
  handleCloseModal: () => void;
}

export function ModalNavegacao({ ordem, handleCloseModal }: ModalDetailOsProps) {
  const [modalTecnicoOpen, setModalTecnicoOpen] = useState(false);
  const [modalDestinoOpen, setModalDestinoOpen] = useState(false);
  const [ordemAtual] = useState<OrdensDeServico | null>(ordem);
  const [time] = useState(0);

  const abrirWaze = (endereco: string) => {
    const url = `https://waze.com/ul?q=${encodeURIComponent(endereco)}`;
    Linking.canOpenURL(url).then(supported => supported ? Linking.openURL(url) : Alert.alert("Erro", "Waze não instalado."));
  };

  const abrirGoogleMaps = (endereco: string) => {
    const url = Platform.select({
      ios: `maps:0,0?q=${encodeURIComponent(endereco)}`,
      android: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(endereco)}`
    });
    if (url) Linking.openURL(url);
  };

  const getDestinos = () => {
    const destinos = [];
    if (ordemAtual?.instituicaoUnidade?.endereco) destinos.push({ label: "Instituição: " + ordemAtual.instituicaoUnidade.name, endereco: ordemAtual.instituicaoUnidade.endereco });
    if (ordemAtual?.user?.cliente?.endereco) destinos.push({ label: "Empresa: " + ordemAtual.user.cliente.name, endereco: ordemAtual.user.cliente.endereco });
    return destinos;
  };

  if (!ordemAtual) return null;

  return (
    <>
      <TouchableOpacity activeOpacity={1} style={styles.overlay} onPress={handleCloseModal} />
      
 <View style={styles.modalContainer}>
  <TouchableOpacity 
    style={[styles.buttonBase, styles.buttonNavigation]} 
    onPress={() => setModalDestinoOpen(true)}
  >
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
      <MaterialIcons name="navigation" size={20} color="#FFF" style={{ marginRight: 8 }} />
      <Text style={styles.textButton}>NAVEGAR ATÉ O LOCAL</Text>
    </View>
  </TouchableOpacity>
</View>

      <Modal visible={modalDestinoOpen} transparent={true} animationType="fade">
        <View style={styles.centeredModal}>

        <View style={styles.modalContent}>
  <Text style={styles.title}>Escolha o destino:</Text>
  {getDestinos().map((item, index) => (
    <View key={index} style={styles.destinoItem}>
      <Text style={{fontWeight: 'bold'}}>{item.label}</Text>
      <View style={styles.rowButtons}>
        <TouchableOpacity style={styles.btnNav} onPress={() => abrirWaze(item.endereco)}>
          <FontAwesome5 name="waze" size={16} color="#FFF" /> <Text style={{color:'#FFF'}}>WAZE</Text>
        </TouchableOpacity>
        <TouchableOpacity 
        style={[styles.btnNav, {backgroundColor:'#27AE60'}]} onPress={() => 
          abrirGoogleMaps(item.endereco)}>
          <FontAwesome5 name="map-marked-alt" size={16} color="#FFF" /> <Text style={{color:'#FFF'}}>GOOGLE MAPS</Text>
        </TouchableOpacity>
      </View>
    </View>
  ))}
  <TouchableOpacity onPress={() => setModalDestinoOpen(false)} style={{marginTop: 15, width: '100%', alignItems: 'center', justifyContent: 'center'}}
><Text>Fechar</Text></TouchableOpacity>
</View>

        </View>
      </Modal>
    </>
  );
}

export default ModalNavegacao;

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)" },
  modalContainer: { 
    width: WIDTH, 
    backgroundColor: "#FFF", 
    paddingHorizontal: 15,
    paddingTop: 10, 
    paddingBottom: 10
  },
  buttonBase: { 
   backgroundColor: "#4E3182", 
    paddingVertical: 15, 
    paddingHorizontal: 30, 
    borderRadius: 8, 
    alignItems: "center",
    width: '90%', 
  },
  buttonNavigation: { backgroundColor: "#4E3182" },
  textButton: { color: "#FFF", fontWeight: "bold" },
  title: { fontSize: 18, fontWeight: "bold" },
  centeredModal: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', padding: 20 },
  modalContent: { backgroundColor: '#FFF', padding: 20, borderRadius: 12 },
  destinoItem: { marginTop: 15, borderBottomWidth: 1, borderColor: '#EEE', paddingBottom: 10 },
  rowButtons: { flexDirection: 'row', gap: 10, marginTop: 10 },
  btnNav: { flex: 1, padding: 10, backgroundColor: '#4E3182', alignItems: 'center', borderRadius: 5 }
});