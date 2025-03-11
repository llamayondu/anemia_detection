import React from "react";
import { View, StyleSheet, Image, Text, ScrollView } from "react-native";
import Background from "../components/Background";
import Header from "../components/Header";
import Button from "../components/Button";

export default function ResultsScreen({ route, navigation }) {
    const { results, imageUri } = route.params;

    const isBlurry = results.isBlurry;
    const variance = results.variance;
    const threshold = results.threshold;

    return (
        <Background>
            <ScrollView contentContainerStyle={styles.scrollContainer}>
                <Header>Image Analysis Results</Header>

                <Image source={{ uri: imageUri }} style={styles.image} />

                <View style={styles.resultsContainer}>
                    <Text style={styles.resultTitle}>
                        Image Quality: {isBlurry ? "Blurry" : "Not Blurry"}
                    </Text>

                    <Text style={styles.resultText}>
                        Laplacian Variance: {variance.toFixed(2)}
                    </Text>

                    <Text style={styles.resultText}>
                        Threshold: {threshold}
                    </Text>

                    <Text style={[
                        styles.analysisText,
                        isBlurry ? styles.blurryText : styles.notBlurryText
                    ]}>
                        {isBlurry
                            ? "The image appears to be blurry. You might want to upload a clearer image."
                            : "The image is clear and of good quality."}
                    </Text>
                </View>

                <Button
                    mode="contained"
                    onPress={() => navigation.navigate("UploadScreen")}
                    style={styles.button}
                >
                    Upload Another Image
                </Button>
            </ScrollView>
        </Background>
    );
}

const styles = StyleSheet.create({
    scrollContainer: {
        flexGrow: 1,
        alignItems: "center",
        padding: 20,
    },
    image: {
        width: 250,
        height: 250,
        marginVertical: 16,
        borderRadius: 8,
    },
    resultsContainer: {
        width: "100%",
        backgroundColor: "#f5f5f5",
        padding: 16,
        borderRadius: 8,
        marginBottom: 16,
    },
    resultTitle: {
        fontSize: 18,
        fontWeight: "bold",
        marginBottom: 8,
    },
    resultText: {
        fontSize: 16,
        marginBottom: 4,
    },
    analysisText: {
        fontSize: 16,
        marginTop: 12,
        fontWeight: "500",
    },
    blurryText: {
        color: "#D32F2F",
    },
    notBlurryText: {
        color: "#388E3C",
    },
    button: {
        marginTop: 16,
        width: "100%",
    }
});