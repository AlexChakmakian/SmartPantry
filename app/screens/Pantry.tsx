import React from 'react';
import { View, Text, FlatList, StyleSheet, Button } from 'react-native';
import { useNavigation } from '@react-navigation/native';

const pantryItems = [
    { id: '1', name: 'Rice' },
    { id: '2', name: 'Pasta' },
    { id: '3', name: 'Flour' },
    { id: '4', name: 'Canned Beans' },
    { id: '5', name: 'Olive Oil' },
    { id: '6', name: 'Spices' },
];

export default function Pantry() {
    const navigation = useNavigation(); // React Navigation hook

    // Navigation functions
    const goToHome = () => navigation.navigate('home');

    return (
        <View style={styles.container}>
            <Text style={styles.header}>Pantry Items</Text>
            <FlatList
                data={pantryItems}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                    <View style={styles.itemContainer}>
                        <Text style={styles.itemText}>{item.name}</Text>
                    </View>
                )}
            />
            {/* Navigation buttons */}
            <Button title="Go to Home" onPress={goToHome} />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
        backgroundColor: '#ADD8E6',
    },
    header: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 20,
        textAlign: 'center',
    },
    itemContainer: {
        padding: 15,
        marginVertical: 8,
        backgroundColor: '#ffffff',
        borderRadius: 8,
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 5,
        elevation: 2,
    },
    itemText: {
        fontSize: 18,
        textAlign: 'center',
    },
});
