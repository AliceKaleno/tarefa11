import React, { useState } from "react";
import { View, Button, Image, FlatList, Text, TouchableOpacity, StyleSheet } from "react-native";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system/legacy";
import SHA1 from "crypto-js/sha1";

export default function App() {
  const [images, setImages] = useState([]);
  const [uploading, setUploading] = useState(false);

  const CLOUD_NAME = "dx1m1r9bu";
  const UPLOAD_PRESET = "atividade11";
  const API_KEY = "766413485274832";
  const API_SECRET = "Gahneq8iGXHBkaUr3p98YlSjmIU";

  const pickImage = async () => {
    console.log(">>> Abrindo seletor de arquivos...");

    const result = await DocumentPicker.getDocumentAsync({
      type: ["image/*"],
      copyToCacheDirectory: true,
    });

    console.log("RESULTADO DO PICKER:", result);

    if (!result.canceled && result.assets?.length > 0) {
      const uri = result.assets[0].uri;
      uploadImage(uri);
    } else {
      alert("Nenhuma imagem selecionada.");
    }
  };

  const uploadImage = async (uri) => {
    try {
      setUploading(true);

      const base64 = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      const publicId = `ifpe_${Date.now()}`;

      const data = new FormData();
      data.append("file", `data:image/jpg;base64,${base64}`);
      data.append("public_id", publicId);
      data.append("upload_preset", UPLOAD_PRESET);
      data.append("folder", "ifpe");
      data.append("tags", "ifpeaula");

      const upload = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
        method: "POST",
        body: data,
      });

      const result = await upload.json();
      console.log("RESULTADO DO UPLOAD:", result);

      if (result.secure_url) {
        setImages((prev) => [...prev, { url: result.secure_url, public_id: result.public_id }]);
      } else {
        alert("⚠ Erro ao enviar imagem.");
      }
    } catch (error) {
      console.log("❌ Erro no upload:", error);
      alert("Erro no upload.");
    } finally {
      setUploading(false);
    }
  };

  const deleteImage = async (publicId) => {
    try {
      const timestamp = Math.floor(Date.now() / 1000);
      const signature = SHA1(`public_id=${publicId}&timestamp=${timestamp}${API_SECRET}`).toString();

      const formData = new FormData();
      formData.append("public_id", publicId);
      formData.append("signature", signature);
      formData.append("api_key", API_KEY);
      formData.append("timestamp", timestamp);

      const del = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/destroy`, {
        method: "POST",
        body: formData,
      });

      const result = await del.json();

      if (result.result === "ok") {
        setImages((prev) => prev.filter((img) => img.public_id !== publicId));
        alert("Imagem excluída!");
      } else {
        alert("Erro ao excluir.");
      }
    } catch (error) {
      alert("Não foi possível excluir.");
    }
  };

  return (
    <View style={styles.container}>
      <Button title={uploading ? "Enviando..." : "Selecionar Imagem"} onPress={pickImage} />
      
      <FlatList
        data={images}
        keyExtractor={(item) => item.public_id}
        renderItem={({ item }) => (
          <View style={styles.item}>
            <Image source={{ uri: item.url }} style={styles.image} />
            <TouchableOpacity style={styles.deleteBtn} onPress={() => deleteImage(item.public_id)}>
              <Text style={{ color: "#fff" }}>Excluir</Text>
            </TouchableOpacity>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 40, paddingHorizontal: 10 },
  item: {
    marginVertical: 10,
    backgroundColor: "#eee",
    padding: 10,
    borderRadius: 10,
    alignItems: "center",
  },
  image: { width: 200, height: 300, borderRadius: 10 },
  deleteBtn: {
    marginTop: 10,
    backgroundColor: "red",
    padding: 10,
    borderRadius: 8,
  },
});
