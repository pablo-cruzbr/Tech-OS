import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Modal,
  SafeAreaView,
  Image,
  Alert,
} from 'react-native';
import { api } from '../../services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import SignatureScreen, { SignatureViewRef } from 'react-native-signature-canvas';
import { MultiSelect } from 'react-native-element-dropdown';
import { MaterialIcons } from '@expo/vector-icons';

interface ModalDetailOrderTecnicoProps {
  ordemId: string;
  handleCloseModal: () => void;
  tempoFinal: number;
}

interface Atividade {
  id: string;
  descricao: string;
}

export function ModalDetailOrderFormTecnico({
  ordemId,
  handleCloseModal,
  tempoFinal,
}: ModalDetailOrderTecnicoProps) {
  const [nameTecnico, setNameTecnico] = useState('');
  const [assinante, setAssinante] = useState('');
  const [diagnostico, setDiagnostico] = useState('');
  const [solucao, setSolucao] = useState('');
  const [signature, setSignature] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [atividadesDB, setAtividadesDB] = useState<Atividade[]>([]);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [showSignatureModal, setShowSignatureModal] = useState(false);

  const signatureRef = useRef<SignatureViewRef>(null);

useEffect(() => {
  async function loadAtividades() {
    try {
      const storageToken = await AsyncStorage.getItem("@AlltiService");
      if (!storageToken) return;

      const { token } = JSON.parse(storageToken);
      if (!token) return;

      const response = await api.get('/listatividade', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      const data = Array.isArray(response.data) ? response.data : (response.data.atividades || []);
      setAtividadesDB(data);

    } catch (error: any) {
      console.error("Erro no teste:", error.response?.status, error.message);
    }
  }

  loadAtividades();
}, []);

  const handleSignature = (sig: string) => {
    setSignature(sig);
    setShowSignatureModal(false);
  };

  const handleSubmit = async () => {
    if (!signature) {
      Alert.alert('Atenção', 'Por favor, adicione a assinatura antes de salvar.');
      return;
    }

    try {
      setLoading(true);
      const storageToken = await AsyncStorage.getItem('@AlltiService');
      if (!storageToken) return;
      const { token } = JSON.parse(storageToken);

      await api.patch(
        `/ordemdeservico/update/${ordemId}`,
        {
          nameTecnico,
          diagnostico,
          solucao,
          assinante,
          assinatura: signature,
          duracao: tempoFinal,
          atividades_ids: JSON.stringify(selectedItems), 
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      Alert.alert('Sucesso', 'Dados Salvos com sucesso!');
      handleCloseModal();
    } catch (error: any) {
      console.error("Erro no envio:", error.response?.data || error.message);
      Alert.alert('Erro', 'Não foi possível atualizar a ordem. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.overlay}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined} 
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <View style={styles.container}>
            <Text style={styles.title}>Descrição Técnica</Text>

            <TextInput
              placeholder="Nome do Técnico"
              style={styles.input}
              value={nameTecnico}
              onChangeText={setNameTecnico}
            />

            <Text style={styles.label}>Atividades Realizadas:</Text>
            <MultiSelect
              style={styles.dropdown}
              data={atividadesDB}
              labelField="descricao"
              valueField="id"
              placeholder="Selecione as atividades..."
              value={selectedItems}
              onChange={item => setSelectedItems(item)}
              selectedStyle={styles.selectedBadge}
              placeholderStyle={{ color: '#999', fontSize: 14 }}
            />

            <TextInput
              placeholder="Diagnóstico"
              style={[styles.input, styles.textArea]}
              value={diagnostico}
              onChangeText={setDiagnostico}
              multiline
            />
            
            <TextInput
              placeholder="Solução"
              style={[styles.input, styles.textArea]}
              value={solucao}
              onChangeText={setSolucao}
              multiline
            />

            <Text style={styles.label}>Responsável que assinou:</Text>
            <TextInput
              placeholder="Nome de quem está assinando"
              style={styles.input}
              value={assinante}
              onChangeText={setAssinante}
            />

            <Text style={styles.label}>Assinatura:</Text>
            {signature ? (
              <View style={styles.signaturePreviewContainer}>
                <Image 
                  source={{ uri: signature }} 
                  style={styles.signatureImage} 
                  resizeMode="contain" 
                />
                <TouchableOpacity style={styles.reSignButton} onPress={() => setShowSignatureModal(true)}>
                  <MaterialIcons name="refresh" size={16} color="#4E3182" />
                  <Text style={styles.reSignText}>Refazer assinatura</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity 
                style={styles.buttonSignatureOpen} 
                onPress={() => setShowSignatureModal(true)}
              >
                <MaterialIcons name="edit" size={20} color="#fff" />
                <Text style={styles.buttonText}>COLETAR ASSINATURA</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={[styles.buttonPrimary, (loading || !signature || !assinante) && { opacity: 0.6 }]}
              onPress={handleSubmit}
              disabled={loading || !signature || !assinante}
            >
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Salvar PROGRESSO</Text>}
            </TouchableOpacity>

            <TouchableOpacity style={styles.buttonClose} onPress={handleCloseModal}>
              <Text style={styles.buttonTextClose}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <Modal visible={showSignatureModal} animationType="slide" transparent={false}>
        <SafeAreaView style={styles.modalSignatureContainer}>
          <View style={styles.modalSignatureHeader}>
            <Text style={styles.modalSignatureTitle}>Assinatura Digital</Text>
            <TouchableOpacity onPress={() => setShowSignatureModal(false)}>
              <MaterialIcons name="close" size={28} color="#4E3182" />
            </TouchableOpacity>
          </View>

          <View style={styles.canvasWrapper}>
            <SignatureScreen
              ref={signatureRef}
              onOK={handleSignature}
              onEmpty={() => Alert.alert('Aviso', 'A assinatura não pode estar vazia')}
              descriptionText=""
              autoClear={false}
              imageType="image/png"
              webStyle={`.m-signature-pad--footer { display: none; }`}
            />
          </View>

          <View style={styles.modalSignatureFooter}>
            <TouchableOpacity style={styles.modalButtonClear} onPress={() => signatureRef.current?.clearSignature()}>
              <Text style={styles.buttonText}>Limpar</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.modalButtonSave} onPress={() => signatureRef.current?.readSignature()}>
              <Text style={styles.buttonText}>Confirmar</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>
    </View>
  );
}


const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: '#fff' },
  scrollContent: { flexGrow: 1, paddingHorizontal: 20, paddingTop: 40, paddingBottom: 40 },
  container: { flex: 1 },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 20, color: '#111' },
  label: { marginBottom: 8, fontWeight: '600', fontSize: 14, color: '#4E3182' },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 12, marginBottom: 15, fontSize: 16 },
  textArea: { height: 90, textAlignVertical: 'top' },
  dropdown: { height: 55, borderColor: '#ddd', borderWidth: 1, borderRadius: 8, paddingHorizontal: 12, marginBottom: 15 },
  selectedBadge: { borderRadius: 20, backgroundColor: '#eee' },
  
  signaturePreviewContainer: {
    width: '100%',
    height: 150,
    borderWidth: 1,
    borderColor: '#28a745',
    borderRadius: 8,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 25,
    overflow: 'hidden'
  },
  signatureImage: { width: '100%', height: '100%' },
  reSignButton: {
    position: 'absolute',
    bottom: 5,
    right: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.9)',
    padding: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#eee'
  },
  reSignText: { color: '#4E3182', fontSize: 12, fontWeight: '600' },
  
  buttonSignatureOpen: {
    backgroundColor: '#6c757d',
    flexDirection: 'row',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 25,
    gap: 10
  },

  modalSignatureContainer: { flex: 1, backgroundColor: '#fff' },
  modalSignatureHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    padding: 20, 
    alignItems: 'center', 
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0'
  },
  modalSignatureTitle: { fontSize: 18, fontWeight: 'bold' },
  canvasWrapper: { 
    flex: 1, 
    backgroundColor: '#fff' 
  },
  modalSignatureFooter: { 
    flexDirection: 'row', 
    padding: 20, 
    gap: 15, 
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0'
  },
  modalButtonClear: { flex: 1, backgroundColor: '#6c757d', padding: 16, borderRadius: 8, alignItems: 'center' },
  modalButtonSave: { flex: 2, backgroundColor: '#28a745', padding: 16, borderRadius: 8, alignItems: 'center' },

  buttonPrimary: { backgroundColor: '#4E3182', padding: 18, borderRadius: 8, alignItems: 'center', marginBottom: 12 },
  buttonClose: { padding: 10, alignItems: 'center' },
  buttonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  buttonTextClose: { color: '#888', fontWeight: '600' },
});