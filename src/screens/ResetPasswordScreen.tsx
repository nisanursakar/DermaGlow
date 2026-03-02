import React, { useState } from "react";
import { View, TextInput, Button, Alert } from "react-native";
import { supabase } from "../../supabase";

export default function ResetPasswordScreen() {
  const [password, setPassword] = useState("");

  const handleUpdate = async () => {
    const { error } = await supabase.auth.updateUser({
      password: password,
    });

    if (error) {
      Alert.alert(error.message);
    } else {
      Alert.alert("Şifre güncellendi.");
    }
  };

  return (
    <View>
      <TextInput
        placeholder="Yeni şifre"
        secureTextEntry
        onChangeText={setPassword}
      />
      <Button title="Kaydet" onPress={handleUpdate} />
    </View>
  );
}