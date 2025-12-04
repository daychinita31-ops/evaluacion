import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Alert,
  ActivityIndicator,
  PermissionsAndroid,
  Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface Ubicacion {
  id: string;
  nombre: string;
  latitud: string;
  longitud: string;
}

export default function App() {
  const [nombre, setNombre] = useState('');
  const [latitud, setLatitud] = useState('');
  const [longitud, setLongitud] = useState('');
  const [ubicaciones, setUbicaciones] = useState<Ubicacion[]>([]);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [cargando, setCargando] = useState(false);

  useEffect(() => {
    cargarUbicaciones();
  }, []);

  const cargarUbicaciones = async () => {
    try {
      const json = await AsyncStorage.getItem('ubicaciones');
      if (json) {
        setUbicaciones(JSON.parse(json));
      }
    } catch (error) {
      console.log('Error:', error);
    }
  };

  const guardarUbicaciones = async (lista: Ubicacion[]) => {
    try {
      await AsyncStorage.setItem('ubicaciones', JSON.stringify(lista));
    } catch (error) {
      console.log('Error:', error);
    }
  };

  const pedirPermisosAndroid = async () => {
    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        {
          title: 'Permiso de ubicación',
          message: 'La app necesita acceder a tu ubicación',
          buttonNeutral: 'Después',
          buttonNegative: 'Cancelar',
          buttonPositive: 'OK',
        },
      );
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    } catch (err) {
      console.log('Error permisos:', err);
      return false;
    }
  };

  const obtenerUbicacionActual = async () => {
    setCargando(true);
    
    try {
      if (Platform.OS === 'android') {
        const tienePermisos = await pedirPermisosAndroid();
        if (!tienePermisos) {
          Alert.alert('Permiso denegado', 'Debes permitir el acceso a la ubicación');
          setCargando(false);
          return;
        }
      }
      navigator.geolocation.getCurrentPosition(
        (posicion) => {
          const lat = posicion.coords.latitude;
          const lng = posicion.coords.longitude;
          
          setLatitud(lat.toString());
          setLongitud(lng.toString());
          
          if (!nombre) {
            setNombre('Mi ubicación actual');
          }
          
          setCargando(false);
          
          Alert.alert(
            'Ubicación obtenida',
            `Latitud: ${lat.toFixed(6)}\nLongitud: ${lng.toFixed(6)}`
          );
        },
        (error) => {
          setCargando(false);
          
          let mensaje = 'No se pudo obtener la ubicación';
          if (error.code === 1) {
            mensaje = 'Permiso denegado. Activa la ubicación en ajustes.';
          } else if (error.code === 2) {
            mensaje = 'Ubicación no disponible. Revisa tu GPS.';
          } else if (error.code === 3) {
            mensaje = 'Tiempo de espera agotado. Intenta de nuevo.';
          }
          
          Alert.alert('Error', mensaje);
        },
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
      );
      
    } catch (error) {
      setCargando(false);
      Alert.alert('Error', 'No se pudo acceder al GPS');
      console.log('Error:', error);
    }
  };

  const agregarUbicacion = () => {
    if (!nombre || !latitud || !longitud) {
      Alert.alert('Error', 'Todos los campos son obligatorios');
      return;
    }

    const lat = parseFloat(latitud);
    const lng = parseFloat(longitud);
    
    if (isNaN(lat) || isNaN(lng)) {
      Alert.alert('Error', 'Las coordenadas deben ser números');
      return;
    }


    const nuevaUbicacion: Ubicacion = {
      id: Date.now().toString(),
      nombre,
      latitud,
      longitud,
    };

    const nuevasUbicaciones = [...ubicaciones, nuevaUbicacion];
    setUbicaciones(nuevasUbicaciones);
    guardarUbicaciones(nuevasUbicaciones);

    setNombre('');
    setLatitud('');
    setLongitud('');
    setMostrarFormulario(false);
    
    Alert.alert('✅ Listo', 'Ubicación guardada');
  };

  const eliminarUbicacion = (id: string) => {
    Alert.alert(
      'Eliminar',
      '¿Eliminar esta ubicación?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          onPress: () => {
            const nuevasUbicaciones = ubicaciones.filter(u => u.id !== id);
            setUbicaciones(nuevasUbicaciones);
            guardarUbicaciones(nuevasUbicaciones);
          },
          style: 'destructive'
        },
      ]
    );
  };

  const limpiarTodo = () => {
    if (ubicaciones.length === 0) return;
    
    Alert.alert(
      'Limpiar todo',
      `¿Eliminar ${ubicaciones.length} ubicaciones?`,
      [
        { text: 'Cancelar' },
        {
          text: 'Limpiar',
          onPress: () => {
            setUbicaciones([]);
            guardarUbicaciones([]);
          },
          style: 'destructive'
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}> Mis Ubicaciones</Text>
        <Text style={styles.subtitle}>
          {ubicaciones.length} guardadas
        </Text>
      </View>

      <TouchableOpacity
        style={styles.toggleButton}
        onPress={() => setMostrarFormulario(!mostrarFormulario)}
      >
        <Text style={styles.toggleButtonText}>
          {mostrarFormulario ? ' Cerrar' : ' Agregar'}
        </Text>
      </TouchableOpacity>

      {mostrarFormulario && (
        <View style={styles.form}>
          <Text style={styles.label}>Nombre:</Text>
          <TextInput
            style={styles.input}
            value={nombre}
            onChangeText={setNombre}
            placeholder="Ej: Casa, Trabajo..."
          />

          <Text style={styles.label}>Latitud:</Text>
          <TextInput
            style={styles.input}
            value={latitud}
            onChangeText={setLatitud}
            placeholder="Ej: 19.432608"
            keyboardType="numbers-and-punctuation"
          />

          <Text style={styles.label}>Longitud:</Text>
          <TextInput
            style={styles.input}
            value={longitud}
            onChangeText={setLongitud}
            placeholder="Ej: -99.133209"
            keyboardType="numbers-and-punctuation"
          />

          <View style={styles.formButtons}>
            <TouchableOpacity
              style={[styles.button, styles.gpsButton]}
              onPress={obtenerUbicacionActual}
              disabled={cargando}
            >
              {cargando ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text style={styles.buttonText}> GPS</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.guardarButton]}
              onPress={agregarUbicacion}
            >
              <Text style={styles.buttonText}>💾 Guardar</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {ubicaciones.length > 0 && (
        <TouchableOpacity
          style={styles.limpiarButton}
          onPress={limpiarTodo}
        >
          <Text style={styles.limpiarButtonText}>🗑️ Limpiar todo</Text>
        </TouchableOpacity>
      )}
      <FlatList
        data={ubicaciones}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.locationCard}>
            <View style={styles.cardContent}>
              <Text style={styles.locationName}>{item.nombre}</Text>
              <Text style={styles.coordinates}>
                📍 {item.latitud}, {item.longitud}
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => eliminarUbicacion(item.id)}
              style={styles.deleteButton}
            >
              <Text style={styles.deleteButtonText}>✕</Text>
            </TouchableOpacity>
          </View>
        )}
        style={styles.list}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No hay ubicaciones</Text>
            <Text style={styles.emptySubtext}>
              Presiona "Agregar" para comenzar
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#4a6fa5',
    paddingTop: Platform.OS === 'ios' ? 50 : 40,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  subtitle: {
    fontSize: 14,
    color: '#e0e0e0',
    marginTop: 5,
  },
  toggleButton: {
    backgroundColor: '#fff',
    margin: 15,
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    elevation: 2,
  },
  toggleButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  form: {
    backgroundColor: 'white',
    marginHorizontal: 15,
    marginBottom: 15,
    padding: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    elevation: 2,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 5,
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 6,
    padding: 10,
    marginBottom: 15,
    fontSize: 16,
  },
  formButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  button: {
    flex: 1,
    padding: 12,
    borderRadius: 6,
    alignItems: 'center',
  },
  gpsButton: {
    backgroundColor: '#3cb802ff',
  },
  ejemploButton: {
    backgroundColor: '#6b5b95',
  },
  guardarButton: {
    backgroundColor: '#2562beff',
  },
  buttonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  limpiarButton: {
    backgroundColor: '#ff6b6b',
    marginHorizontal: 15,
    marginBottom: 15,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  limpiarButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  list: {
    flex: 1,
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    marginTop: 10,
  },
  locationCard: {
    backgroundColor: 'white',
    marginHorizontal: 15,
    marginBottom: 10,
    padding: 15,
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    elevation: 1,
  },
  cardContent: {
    flex: 1,
  },
  locationName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  coordinates: {
    fontSize: 14,
    color: '#666',
  },
  deleteButton: {
    padding: 8,
    marginLeft: 10,
  },
  deleteButtonText: {
    fontSize: 18,
    color: '#ff6b6b',
    fontWeight: 'bold',
  },
});