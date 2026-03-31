import React from "react";
import { SafeAreaView, ScrollView, StyleSheet, Text, View } from "react-native";

const lanes = [
  {
    title: "Administracion",
    copy: "Control de candidatos, cursos, marketing y talento con vista tipo app.",
  },
  {
    title: "Novatos",
    copy: "Seguimiento de contratacion, clases, soporte y rutas de onboarding.",
  },
  {
    title: "Usuarios",
    copy: "Comunidad, novedades, contenido profesional y perfil laboral.",
  },
];

export default function App() {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.hero}>
          <Text style={styles.eyebrow}>VHV INTERNO MOBILE</Text>
          <Text style={styles.title}>Base movil conectada con la experiencia web.</Text>
          <Text style={styles.copy}>
            Esta capa Expo queda lista para evolucionar a app nativa mientras la web publica funciona
            tambien como app instalable.
          </Text>
        </View>

        {lanes.map((lane) => (
          <View key={lane.title} style={styles.card}>
            <Text style={styles.cardTitle}>{lane.title}</Text>
            <Text style={styles.cardCopy}>{lane.copy}</Text>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0d0a08",
  },
  content: {
    padding: 24,
    gap: 18,
  },
  hero: {
    borderRadius: 28,
    padding: 24,
    backgroundColor: "#1a120d",
    borderWidth: 1,
    borderColor: "rgba(215, 161, 46, 0.24)",
  },
  eyebrow: {
    color: "#d7a12e",
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 2,
    marginBottom: 10,
  },
  title: {
    color: "#f8f4ef",
    fontSize: 30,
    lineHeight: 36,
    fontWeight: "800",
    marginBottom: 12,
  },
  copy: {
    color: "#d0c4b5",
    fontSize: 16,
    lineHeight: 24,
  },
  card: {
    borderRadius: 24,
    padding: 20,
    backgroundColor: "#15100c",
    borderWidth: 1,
    borderColor: "rgba(215, 161, 46, 0.18)",
  },
  cardTitle: {
    color: "#f8f4ef",
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 8,
  },
  cardCopy: {
    color: "#c9bfae",
    fontSize: 15,
    lineHeight: 22,
  },
});
