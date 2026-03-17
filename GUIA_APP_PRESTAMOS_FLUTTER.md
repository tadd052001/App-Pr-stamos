# Guía completa (paso a paso) para crear una app móvil de control de préstamos (sin saber programar)

> Objetivo: construir una aplicación personal para prestamistas, con registro de clientes, préstamos, pagos, cálculo automático de intereses, historial y reportes.

---

## 0) ¿Qué vamos a construir?

Una app en **Flutter** (una sola base de código) que funcione en **Android e iOS** y guarde datos localmente con **SQLite**.

Al finalizar tendrás:
- Registro de clientes (nombre/alias, ID automático).
- Registro de préstamos por cliente.
- Registro de pagos con reglas de negocio.
- Cálculo automático de intereses simples por meses.
- Historial completo de movimientos.
- Reportes y resumen mensual.

---

## 1) Herramientas que vamos a usar (y para qué sirve cada una)

1. **Flutter SDK**
   - Sirve para crear apps móviles Android/iOS con un solo proyecto.
2. **Dart**
   - Es el lenguaje de programación de Flutter.
3. **Visual Studio Code (VS Code)**
   - Editor de código fácil de usar.
4. **Android Studio**
   - Lo usaremos para instalar el SDK de Android y emuladores.
5. **Xcode (solo macOS)**
   - Necesario para compilar y ejecutar en iPhone/iOS.
6. **SQLite** (a través del paquete `sqflite`)
   - Base de datos local, rápida y offline.
7. **Emulador (Android) / Simulador (iOS)**
   - Permite probar la app sin teléfono físico.

---

## 2) Instalación desde cero

> No avances hasta que cada subpaso funcione.

### Paso 2.1 — Instalar Flutter

1. Ve a: https://docs.flutter.dev/get-started/install
2. Descarga Flutter para tu sistema (Windows/macOS/Linux).
3. Descomprime Flutter en una ruta simple (por ejemplo `C:\src\flutter` o `~/development/flutter`).
4. Agrega Flutter al `PATH` del sistema.

**Prueba**

```bash
flutter --version
```

**Debe pasar**
- Ves versión de Flutter y Dart en consola.

**Errores comunes**
- *“flutter no se reconoce como comando”*: no agregaste Flutter al `PATH`.
- *Permisos en Linux/macOS*: ejecuta `chmod -R 755 <ruta_flutter>`.

---

### Paso 2.2 — Instalar VS Code y extensiones

1. Instala VS Code: https://code.visualstudio.com/
2. Abre VS Code.
3. Instala extensiones:
   - **Flutter**
   - **Dart**

**Prueba**
- En VS Code, abre “Command Palette” (`Ctrl+Shift+P` o `Cmd+Shift+P`) y escribe `Flutter: New Project`.

**Debe pasar**
- Debe aparecer el comando.

**Errores comunes**
- No aparece el comando: faltan extensiones Flutter/Dart.

---

### Paso 2.3 — Instalar Android Studio y emulador

1. Instala Android Studio: https://developer.android.com/studio
2. Abre Android Studio → instala:
   - Android SDK
   - Android SDK Platform-Tools
   - Android Emulator
3. Crea un emulador (AVD):
   - Device: Pixel 6 (o similar)
   - Android 13 o superior

**Prueba**

```bash
flutter doctor
```

**Debe pasar**
- Flutter detecta Android toolchain y al menos 1 dispositivo/emulador.

**Errores comunes**
- Licencias pendientes: ejecuta `flutter doctor --android-licenses` y acepta todo.
- Virtualización desactivada: habilitar en BIOS.

---

### Paso 2.4 — iOS (solo si usarás Mac)

1. Instala Xcode desde App Store.
2. Abre Xcode una vez para aceptar licencia.
3. Instala CocoaPods:

```bash
sudo gem install cocoapods
```

**Prueba**

```bash
flutter doctor
```

**Debe pasar**
- iOS toolchain en verde.

---

## 3) Crear el proyecto base

### Paso 3.1 — Crear proyecto Flutter

```bash
flutter create app_prestamos
cd app_prestamos
```

**Prueba**

```bash
flutter run
```

**Debe pasar**
- Abre app de contador por defecto.

**Errores comunes**
- No hay dispositivos: abre emulador o conecta celular con depuración USB.

---

### Paso 3.2 — Instalar paquetes necesarios

Edita `pubspec.yaml` y agrega:

```yaml
dependencies:
  flutter:
    sdk: flutter
  sqflite: ^2.3.3+1
  path: ^1.9.0
  intl: ^0.19.0
  fl_chart: ^0.68.0
  uuid: ^4.4.0
```

Después ejecuta:

```bash
flutter pub get
```

**Debe pasar**
- Se descargan paquetes sin error.

**Errores comunes**
- Indentación YAML incorrecta: respeta espacios.

---

## 4) Estructura de carpetas recomendada

Dentro de `lib/` crea:

```text
lib/
  main.dart
  data/
    database_helper.dart
  models/
    cliente.dart
    prestamo.dart
    pago.dart
    movimiento.dart
  services/
    calculo_service.dart
  screens/
    home_screen.dart
    clientes_screen.dart
    prestamos_screen.dart
    pagos_screen.dart
    reportes_screen.dart
  widgets/
    resumen_card.dart
```

**Prueba**
- Verifica que todas las carpetas/archivos existen.

---

## 5) Base de datos (SQLite) y relaciones

### Paso 5.1 — Crear tablas

Archivo: `lib/data/database_helper.dart`

```dart
import 'package:path/path.dart';
import 'package:sqflite/sqflite.dart';

class DatabaseHelper {
  static final DatabaseHelper instance = DatabaseHelper._init();
  static Database? _database;

  DatabaseHelper._init();

  Future<Database> get database async {
    if (_database != null) return _database!;
    _database = await _initDB('prestamos.db');
    return _database!;
  }

  Future<Database> _initDB(String filePath) async {
    final dbPath = await getDatabasesPath();
    final path = join(dbPath, filePath);

    return await openDatabase(
      path,
      version: 1,
      onCreate: _createDB,
    );
  }

  Future _createDB(Database db, int version) async {
    await db.execute('''
      CREATE TABLE Clientes (
        id TEXT PRIMARY KEY,
        nombre TEXT NOT NULL,
        createdAt TEXT NOT NULL
      )
    ''');

    await db.execute('''
      CREATE TABLE Prestamos (
        id TEXT PRIMARY KEY,
        clienteId TEXT NOT NULL,
        montoInicial REAL NOT NULL,
        saldoCapital REAL NOT NULL,
        interesMensual REAL NOT NULL,
        interesAcumulado REAL NOT NULL DEFAULT 0,
        fechaInicio TEXT NOT NULL,
        fechaUltimoCalculo TEXT NOT NULL,
        fechaUltimoPago TEXT,
        activo INTEGER NOT NULL DEFAULT 1,
        FOREIGN KEY (clienteId) REFERENCES Clientes(id)
      )
    ''');

    await db.execute('''
      CREATE TABLE Pagos (
        id TEXT PRIMARY KEY,
        prestamoId TEXT NOT NULL,
        fechaPago TEXT NOT NULL,
        monto REAL NOT NULL,
        aplicadoInteres REAL NOT NULL,
        aplicadoCapital REAL NOT NULL,
        FOREIGN KEY (prestamoId) REFERENCES Prestamos(id)
      )
    ''');

    await db.execute('''
      CREATE TABLE MovimientosHistoricos (
        id TEXT PRIMARY KEY,
        prestamoId TEXT NOT NULL,
        tipo TEXT NOT NULL,
        fecha TEXT NOT NULL,
        monto REAL NOT NULL,
        detalle TEXT,
        FOREIGN KEY (prestamoId) REFERENCES Prestamos(id)
      )
    ''');
  }
}
```

**Qué valida este paso**
- Tu app ya tiene base de datos y las 4 tablas exigidas.

**Prueba rápida**
- Ejecuta app una vez (`flutter run`) para que se cree la BD.

**Errores comunes**
- Si cambias SQL y no se refleja: desinstala app del emulador o sube versión de BD.

---

## 6) Modelos de datos

### Paso 6.1 — Modelo Cliente

Archivo: `lib/models/cliente.dart`

```dart
class Cliente {
  final String id;
  final String nombre;

  Cliente({required this.id, required this.nombre});

  Map<String, dynamic> toMap() => {
        'id': id,
        'nombre': nombre,
        'createdAt': DateTime.now().toIso8601String(),
      };
}
```

### Paso 6.2 — Modelo Préstamo

Archivo: `lib/models/prestamo.dart`

```dart
class Prestamo {
  final String id;
  final String clienteId;
  final double montoInicial;
  final double saldoCapital;
  final double interesMensual;
  final double interesAcumulado;
  final DateTime fechaInicio;
  final DateTime fechaUltimoCalculo;
  final DateTime? fechaUltimoPago;

  Prestamo({
    required this.id,
    required this.clienteId,
    required this.montoInicial,
    required this.saldoCapital,
    required this.interesMensual,
    required this.interesAcumulado,
    required this.fechaInicio,
    required this.fechaUltimoCalculo,
    this.fechaUltimoPago,
  });
}
```

### Paso 6.3 — Modelo Pago

Archivo: `lib/models/pago.dart`

```dart
class Pago {
  final String id;
  final String prestamoId;
  final DateTime fechaPago;
  final double monto;
  final double aplicadoInteres;
  final double aplicadoCapital;

  Pago({
    required this.id,
    required this.prestamoId,
    required this.fechaPago,
    required this.monto,
    required this.aplicadoInteres,
    required this.aplicadoCapital,
  });
}
```

### Paso 6.4 — Modelo Movimiento

Archivo: `lib/models/movimiento.dart`

```dart
class Movimiento {
  final String id;
  final String prestamoId;
  final String tipo; // PRESTAMO, PAGO, INTERES
  final DateTime fecha;
  final double monto;
  final String? detalle;

  Movimiento({
    required this.id,
    required this.prestamoId,
    required this.tipo,
    required this.fecha,
    required this.monto,
    this.detalle,
  });
}
```

**Prueba**
- `flutter analyze`

**Debe pasar**
- Sin errores de sintaxis.

---

## 7) Lógica principal de cálculo de intereses y aplicación de pagos

> Este es el corazón de la app.

Archivo: `lib/services/calculo_service.dart`

```dart
class ResultadoPago {
  final double interesGenerado;
  final double aplicadoInteres;
  final double aplicadoCapital;
  final double nuevoInteresAcumulado;
  final double nuevoSaldoCapital;

  ResultadoPago({
    required this.interesGenerado,
    required this.aplicadoInteres,
    required this.aplicadoCapital,
    required this.nuevoInteresAcumulado,
    required this.nuevoSaldoCapital,
  });
}

class CalculoService {
  static int mesesTranscurridos(DateTime desde, DateTime hasta) {
    int meses = (hasta.year - desde.year) * 12 + (hasta.month - desde.month);
    if (hasta.day < desde.day) meses -= 1;
    return meses < 0 ? 0 : meses;
  }

  static ResultadoPago procesarPago({
    required double saldoCapital,
    required double interesAcumulado,
    required double interesMensual,
    required DateTime fechaUltimoCalculo,
    required DateTime fechaPago,
    required double montoPago,
  }) {
    if (montoPago <= 0) {
      throw Exception('El pago debe ser mayor a 0');
    }

    final meses = mesesTranscurridos(fechaUltimoCalculo, fechaPago);
    final interesGenerado = saldoCapital * (interesMensual / 100) * meses;
    double interesTotal = interesAcumulado + interesGenerado;

    final deudaTotal = saldoCapital + interesTotal;
    if (montoPago > deudaTotal) {
      throw Exception('El pago no puede ser mayor al saldo pendiente total');
    }

    final aplicadoInteres = montoPago >= interesTotal ? interesTotal : montoPago;
    final restante = montoPago - aplicadoInteres;
    final aplicadoCapital = restante > saldoCapital ? saldoCapital : restante;

    final nuevoInteresAcumulado = interesTotal - aplicadoInteres;
    final nuevoSaldoCapital = saldoCapital - aplicadoCapital;

    if (nuevoSaldoCapital < 0) {
      throw Exception('El saldo de capital no puede ser negativo');
    }

    return ResultadoPago(
      interesGenerado: interesGenerado,
      aplicadoInteres: aplicadoInteres,
      aplicadoCapital: aplicadoCapital,
      nuevoInteresAcumulado: nuevoInteresAcumulado,
      nuevoSaldoCapital: nuevoSaldoCapital,
    );
  }
}
```

**Qué valida este paso**
- Interés simple por meses.
- Pago primero a interés, luego capital.
- No permite pago mayor a deuda total.
- No permite saldo negativo.

**Prueba manual rápida (conceptual)**
- Capital: 1000
- Interés mensual: 10%
- 2 meses sin pagar → interés = 200
- Pago 150 → 150 va a interés, capital queda 1000, interés pendiente 50.

---

## 8) Pantallas de la app

## Paso 8.1 — `main.dart` y navegación

Archivo: `lib/main.dart`

```dart
import 'package:flutter/material.dart';
import 'screens/home_screen.dart';

void main() {
  runApp(const PrestamosApp());
}

class PrestamosApp extends StatelessWidget {
  const PrestamosApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      debugShowCheckedModeBanner: false,
      title: 'Control de Préstamos',
      theme: ThemeData(useMaterial3: true, colorSchemeSeed: Colors.green),
      home: const HomeScreen(),
    );
  }
}
```

Archivo: `lib/screens/home_screen.dart`

```dart
import 'package:flutter/material.dart';
import 'clientes_screen.dart';
import 'reportes_screen.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  int _index = 0;
  final _pages = const [ClientesScreen(), ReportesScreen()];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('App Prestamista')),
      body: _pages[_index],
      bottomNavigationBar: NavigationBar(
        selectedIndex: _index,
        onDestinationSelected: (v) => setState(() => _index = v),
        destinations: const [
          NavigationDestination(icon: Icon(Icons.people), label: 'Clientes'),
          NavigationDestination(icon: Icon(Icons.bar_chart), label: 'Reportes'),
        ],
      ),
    );
  }
}
```

**Prueba**
- Debes ver barra inferior con 2 pestañas: Clientes y Reportes.

---

### Paso 8.2 — Pantalla de clientes (lista + resumen rápido)

Archivo: `lib/screens/clientes_screen.dart` (inicial)

```dart
import 'package:flutter/material.dart';

class ClientesScreen extends StatelessWidget {
  const ClientesScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: const [
        Card(
          child: ListTile(
            title: Text('Clientes'),
            subtitle: Text('Aquí verás lista + saldo + intereses por cliente'),
          ),
        )
      ],
    );
  }
}
```

Archivo: `lib/screens/reportes_screen.dart` (placeholder)

```dart
import 'package:flutter/material.dart';

class ReportesScreen extends StatelessWidget {
  const ReportesScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return const Center(child: Text('Reportes'));
  }
}
```

**Prueba**
- App debe abrir sin errores y mostrar contenido básico.

---

## 9) CRUD básico: Clientes, Préstamos y Pagos

> Aquí conectas pantalla + base de datos. Hazlo en orden.

### Paso 9.1 — Registrar cliente

- Agrega un botón “Nuevo cliente”.
- Abre diálogo con campo `nombre`.
- Genera ID con `uuid`.
- Inserta en tabla `Clientes`.

**Código clave (inserción):**

```dart
await db.insert('Clientes', {
  'id': const Uuid().v4(),
  'nombre': nombre,
  'createdAt': DateTime.now().toIso8601String(),
});
```

**Qué debería pasar**
- Al guardar, cliente aparece en lista.

**Prueba**
- Crear 2 clientes y cerrar/abrir app: deben seguir ahí.

---

### Paso 9.2 — Registrar préstamo por cliente

Campos:
- Monto prestado
- Fecha de inicio
- Tasa mensual (%)

Insertar en `Prestamos` con:
- `saldoCapital = montoInicial`
- `interesAcumulado = 0`
- `fechaUltimoCalculo = fechaInicio`

Agregar también movimiento tipo `PRESTAMO` en `MovimientosHistoricos`.

**Prueba**
- Crear préstamo de 1000 al 10% mensual.
- Debe verse en la pantalla de préstamos del cliente.

---

### Paso 9.3 — Registrar pago

Antes de insertar el pago:
1. Obtener préstamo actual.
2. Ejecutar `CalculoService.procesarPago(...)`.
3. Validar reglas (no pago mayor a deuda total, no negativo).
4. Guardar pago en `Pagos`.
5. Actualizar `Prestamos` (saldo/interés/fechas).
6. Insertar movimientos:
   - `INTERES` (si se generó interés)
   - `PAGO`

**Prueba**
- Simula préstamo con meses sin pago y luego registra pago.
- Verifica que primero baje interés, luego capital.

---

## 10) Reportes automáticos

En `ReportesScreen` agrega consultas SQL:

1. **Dinero prestado actualmente**
   - `SUM(saldoCapital) WHERE activo = 1`
2. **Intereses ganados acumulados**
   - `SUM(aplicadoInteres) en Pagos`
3. **Resumen mensual**
   - Agrupar pagos por `strftime('%Y-%m', fechaPago)`
4. **Historial por cliente/préstamo**
   - JOIN entre tablas + filtros

Para gráficos usa `fl_chart`.

**Prueba**
- Debes ver tarjetas de resumen y al menos un gráfico de barras por mes.

---

## 11) Reglas obligatorias (checklist)

Verifica que tu app cumpla:
- [ ] Cliente con ID único automático.
- [ ] Interés simple sobre saldo de capital pendiente por meses.
- [ ] Pago no puede ser mayor a deuda total.
- [ ] Saldo de capital nunca negativo.
- [ ] Pago aplica primero a interés, luego a capital.
- [ ] Historial completo en `MovimientosHistoricos`.
- [ ] Pantallas: clientes, préstamos, pagos, reportes.

---

## 12) Escenarios de prueba (obligatorios)

> Haz estas pruebas una por una y toma nota de resultados.

### Escenario A — Pagos parciales
1. Préstamo: 1000, 10% mensual, fecha inicio hace 2 meses.
2. Pago: 150.

**Esperado**
- Interés generado = 200.
- Pago aplicado a interés = 150.
- Capital sigue en 1000.
- Interés pendiente = 50.

### Escenario B — Pago adelantado (antes de 1 mes)
1. Préstamo: 1000, 10% mensual.
2. Pago a los 10 días: 100.

**Esperado**
- Meses transcurridos = 0.
- Interés generado = 0.
- Todo el pago va a capital.

### Escenario C — Varios meses sin pagos
1. Préstamo: 2000, 5% mensual, sin pago 4 meses.

**Esperado**
- Interés generado = 2000 * 0.05 * 4 = 400.

### Escenario D — Pago exacto para cerrar todo
1. Deuda total exacta = capital + interés.
2. Registrar pago exacto.

**Esperado**
- Saldo capital = 0.
- Interés acumulado = 0.
- Préstamo puede marcarse inactivo.

### Escenario E — Pago mayor al saldo
1. Intentar pagar más que deuda total.

**Esperado**
- App debe bloquear y mostrar mensaje de error.

---

## 13) Errores comunes (y solución)

1. **La BD no refleja cambios de tablas**
   - Sube versión de DB o reinstala app.
2. **`NoSuchMethod` / `null` en fechas**
   - Valida fechas nulas antes de calcular.
3. **`FormatException` al convertir números**
   - Usa `double.tryParse()` y valida campos vacíos.
4. **Pago mayor a deuda permitido por error**
   - Revisa validación en `CalculoService` antes de guardar.
5. **Interés mal calculado por días**
   - Recuerda: esta guía calcula por **meses completos**.

---

## 14) Mejoras recomendadas (después de terminar)

- Exportar reportes a PDF/Excel.
- Copia de seguridad en la nube (Firebase/Drive).
- Bloqueo con PIN/huella.
- Recordatorios automáticos de cobro.
- Multiusuario (si crece el negocio).

---

## 15) Ruta de trabajo sugerida (muy importante)

Sigue exactamente este orden:
1. Instalar herramientas.
2. Crear proyecto.
3. Configurar paquetes.
4. Crear BD y tablas.
5. Crear modelos.
6. Programar `CalculoService`.
7. Probar cálculos manuales.
8. Construir pantalla Clientes.
9. Construir pantalla Préstamos.
10. Construir pantalla Pagos.
11. Construir Reportes.
12. Ejecutar los 5 escenarios de prueba.

**Regla de oro:**
No avances al siguiente paso hasta que el actual funcione correctamente.

---

## 16) Resultado final esperado

Al completar la guía tendrás una app que permite al prestamista:
- Control total del saldo por préstamo.
- Cálculo automático y confiable de intereses.
- Historial completo para auditoría.
- Reportes claros de ganancias e intereses.

Si quieres, como siguiente fase, puedes convertir esta guía en un proyecto “copiar y pegar” completo con todos los archivos ya implementados uno por uno.
