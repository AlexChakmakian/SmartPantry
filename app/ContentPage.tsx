import React from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';

const ContentPage = ({ route }) => {
  const { title } = route.params;
  
  // Sample data for demonstration
  const data = [
    { id: '1', name: `${title} Item 1` },
    { id: '2', name: `${title} Item 2` },
    { id: '3', name: `${title} Item 3` },
    // Add more items as needed
  ];

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      <FlatList
        data={data}
        renderItem={({ item }) => (
          <View style={styles.item}>
            <Text style={styles.itemText}>{item.name}</Text>
          </View>
        )}
        keyExtractor={(item) => item.id}
        numColumns={2} // Display items in a grid
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  item: {
    backgroundColor: '#ADD8E6',
    margin: 10,
    padding: 20,
    borderRadius: 5,
    flex: 1,
    alignItems: 'center',
  },
  itemText: {
    fontSize: 18,
  },
});

export default ContentPage;