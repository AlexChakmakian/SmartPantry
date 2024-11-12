
import React from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';

// Example pantry with dummy data
const pantryItems = [
    { id: '1', name: 'Item1' },
    { id: '2', name: 'Item2' },
    { id: '3', name: 'Item3' },
    { id: '4', name: 'Item4' },
    { id: '5', name: 'Item5' },
    { id: '6', name: 'Item6' },
    
];

export default function Fridge() {
    return (
        <View style={styles.container}>
            <Text style={styles.header}>Fridge Items</Text>
            <FlatList
                data={pantryItems}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                    <View style={styles.itemContainer}>
                        <Text style={styles.itemText}>{item.name}</Text>
                    </View>
                )}
            />
        </View>
    );
};

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