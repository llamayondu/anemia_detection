import React, { useState } from "react";
import { View, StyleSheet, Image, Alert } from "react-native";
import * as ImagePicker from "expo-image-picker";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Background from "../components/Background";
import Header from "../components/Header";
import Button from "../components/Button";

export default function UploadScreen({ navigation }) {
  const [imageUri, setImageUri] = useState(null);
  const [loading, setLoading] = useState(false);

  async function pickImage() {
    try {
      // Request permission
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Please grant camera roll permissions to upload an image.');
        return;
      }

      console.log("Launching image picker...");
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
        base64: true,
      });

      console.log("Image picker result:", JSON.stringify({
        ...result,
        assets: result.assets ? [{...result.assets[0], base64: "...base64 data..."}] : null
      }));
      
      // Check newer API structure first (result.assets array)
      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        if (asset.base64) {
          console.log("Image selected successfully with assets array");
          setImageUri(asset.uri);
          uploadImage(asset.base64);
          return;
        }
      }
      
      // Fallback to older API structure
      if (!result.cancelled && result.base64) {
        console.log("Image selected successfully with direct properties");
        setImageUri(result.uri);
        uploadImage(result.base64);
        return;
      }
      
      console.log("No valid image data found in picker result");
    } catch (err) {
      console.log("Error picking image:", err);
      Alert.alert("Error", "Failed to pick image: " + err.message);
    }
  }

  async function uploadImage(base64Image) {
    if (!base64Image) {
      console.error("No base64 image data to upload");
      return;
    }
    
    try {
      console.log("Starting image upload with data length:", base64Image.length);
      setLoading(true);
      
      const token = await AsyncStorage.getItem("token");
      if (!token) {
        console.error("No authentication token found");
        Alert.alert("Error", "You must be logged in to upload images");
        return;
      }
      
      console.log("Token retrieved, sending to server...");
      
      const response = await fetch("http://10.0.2.2:3000/api/upload-image", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({
          imageData: `data:image/jpeg;base64,${base64Image}`,
        }),
      });

      console.log("Server response status:", response.status);
      const responseText = await response.text();
      console.log("Raw server response:", responseText);
      
      let data;
      try {
        data = JSON.parse(responseText);
        console.log("Parsed response:", data);
      } catch (e) {
        console.error("Failed to parse server response as JSON:", e);
        Alert.alert("Error", "Invalid response from server");
        return;
      }
      
      if (data.success) {
        console.log("Image upload successful, navigating to display screen");
        navigation.navigate("DisplayImageScreen");
      } else {
        console.error("Server returned error:", data.error);
        Alert.alert("Error", data.error || "Failed to upload image.");
      }
    } catch (err) {
      console.error("Error uploading image:", err);
      Alert.alert("Error", "An error occurred while uploading the image: " + err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Background>
      <Header>Upload Your Image</Header>
      {imageUri && <Image source={{ uri: imageUri }} style={styles.image} />}
      <Button 
        mode="contained" 
        onPress={pickImage}
        loading={loading}
        disabled={loading}
      >
        {imageUri ? "Replace Image" : "Upload Image"}
      </Button>
    </Background>
  );
}

const styles = StyleSheet.create({
  image: {
    width: 200,
    height: 200,
    marginVertical: 16,
  },
});
