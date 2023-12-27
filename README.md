<!-- PROJECT DESCRIPTION -->

# RXDB TODO

RXDB TODO es una aplicación de lista de tareas (TODO list) intuitiva y eficiente que integra RXDB con un backend de GraphQL en Rails. Desarrollada con Ionic en el frontend, esta aplicación permite operaciones CRUD directas con RXDB, que a su vez sincroniza con la base de datos de Rails.

Este proyecto se concibió como un piloto para probar un concepto, sirviendo como un punto de referencia y aprendizaje para el desarrollo de aplicaciones más complejas en el futuro. El presente README proporciona una guía detallada sobre cómo se maneja la sincronización entre RXDB y Rails, asegurando una comprensión clara de su funcionalidad y arquitectura.

El backend del proyecto se puede encontrar en el siguiente repositorio: [RXDB Backend](https://github.com/carreraprogrammer/rxdb-backend)

<!-- TABLE OF CONTENTS -->

## Tabla de Contenidos

- [Pila Tecnológica](#tech-stack) 🛠️
- [Características Principales](#key-features) ✨
- [Comenzando](#getting-started) 🚀
  - [Configuración](#setup) 🔧
  - [Instalación](#installation) ⚙️
  - [Uso](#usage) 🧰
  - [Pruebas](#testing) :nut_and_bolt:
- [Autores](#authors) 🖋️
- [Funciones Futuras](#future-features) 🌟
- [Contribuyendo](#contributing) 🤝
- [Tablero Kanban](#kanban) :orange_book:
- [Soporte](#support) 🆘
- [Agradecimientos](#acknowledgments) 🌲
- [Licencia](#license) 📄

<!-- TECH STACK -->

## Pila Tecnológica 🛠️ <a name="tech-stack"></a>

  - Ionic
  - RXDB
  - GraphQL
  - Rails
  - Otras dependencias y herramientas relevantes

<p align="right">(<a href="#readme-top">back to top</a>)</p>

<!-- KEY FEATURES -->

## ✨ Características Principales<a name="key-features"></a>

 - **Sincronización con RXDB**: La aplicación utiliza RXDB para realizar operaciones CRUD en la lista de tareas, sincronizándose con el backend de Rails.
 - **Operación de Pull**: Mediante GraphQL, la aplicación implementa una operación de pull para sincronizar los datos desde el backend de Rails hacia RXDB.
 - **Operación de Push**: Similarmente, se implementa una operación de push para enviar cambios desde RXDB al backend de Rails.

<p align="right">(<a href="#readme-top">back to top</a>)</p>

<!-- LIVE DEMO -->

[No Aplica]

<!-- GETTING STARTED -->

## 🚀 Comenzando<a name="getting-started"></a>

### Configuración 🔧<a name="setup"></a>

Para obtener una copia local y ejecutarla, sigue estos pasos. Elige el directorio en tu máquina local donde quieras copiar el proyecto. Por ejemplo:

```cd /home/user/nombre-de-tu-directorio```

Clona el proyecto utilizando una de las opciones.

Usando clave SSH:

Para el backend: 

```git clone git@github.com:carreraprogrammer/rxdb-backend.git```

Para el frontend:

```git clone git@github.com:carreraprogrammer/rxdb-frontend.git```

### Instalación ⚙️<a name="installation"></a>

Para ejecutar este proyecto localmente, sigue estos pasos:

1. Abre tu terminal o línea de comandos.

2. Navega al directorio donde has clonado o descargado el repositorio de RXDB TODO.

3. Ejecuta los siguientes comandos para instalar las dependencias requeridas:

Para el frontend:

```npm install```

Para el backend:

```bundle install```


### Uso 🧰<a name="usage"></a>

1. Completar la Configuración: Asegúrate de haber completado el proceso de configuración mencionado anteriormente.

2. Verificación del Servidor Backend: Asegúrate de que tu backend en Rails esté funcionando. Puedes verificar su accesibilidad abriendo tu navegador web y navegando a la siguiente URL:

```http://localhost:3000/graphql```

Esta URL debería mostrar la respuesta del backend.

Para iniciar el servidor backend en Rails, usa:

```rails s ```

3. Una vez que hayas confirmado que tu servidor está funcionando, puedes iniciar el servidor de desarrollo para tu aplicación Ionic. Para evitar conflictos con la aplicación Rails (que usa el puerto 3000), elige un puerto diferente para tu aplicación Ionic. Actualmente, estamos usando el puerto 8100, lo que no provocará errores en este momento.

Ejecuta el siguiente comando para ver la versión en el navegador:

```ionic serve --port 8100```

O usa este comando para ver la versión en Android Studio:

```npx cap open android --port 8100```



#### Sincronización Pull

La sincronización Pull es esencial para mantener actualizado el estado local de la base de datos RXDB con los últimos cambios del backend en Rails. Este proceso se inicia con una consulta GraphQL que solicita los datos más recientes desde el backend. Si no existe un checkpoint, la funcion genera uno inicializado en 0. La consulta se estructura de la siguiente manera:

```javascript
const pullQueryBuilder = (checkpoint, limit) => {
  if (!checkpoint || checkpoint === null) {
    checkpoint = {
      id: "0",
      updatedAt: "1970-01-01T00:00:00Z"
    };
  }
  
  const query = `query SyncTodos($checkpoint: CheckpointInput, $limit: Int) {
    syncTodos(checkpoint: $checkpoint, limit: $limit) {
      documents {
        id
        text
        isCompleted
        deleted
        createdAt
        updatedAt
      }
      checkpoint {
        id
        updatedAt
      }
    }
  }`;
  
  return {
    query,
    operationName: 'SyncTodos',
    variables: {
      checkpoint,
      limit
    }
  };
};
```

En el backend de Rails, esta consulta es procesada para retornar los todos que han sido modificados desde el último checkpoint. Además, se genera un nuevo checkpoint basado en el último todo actualizado.


```module Types
  class QueryType < Types::BaseObject
    # Definición de campos y argumentos para GraphQL
    field :sync_todos, SyncTodosReturnType, null: false do
      argument :checkpoint, Types::CheckpointInputType, required: false
      argument :limit, Integer, required: false
    end

    # Otros campos y métodos...

    # Método para la sincronización de todos
    def sync_todos(checkpoint: nil, limit: nil)
      # Lógica para construir la consulta en función del checkpoint
      # y devolver los datos junto con un nuevo checkpoint
      # ...
    end

    # Método para obtener el último checkpoint
    def current_checkpoint
      # Lógica para determinar el último checkpoint
      # ...
    end
  end
end
```


### Sincronización Push en RXDB

La operación de Push en RXDB envía cambios locales al backend de Rails. La estructura de la consulta GraphQL incluye un arreglo de rows, donde cada row representa un todo con su estado actual y, si es aplicable, el estado anterior (assumedMasterState).


```const pushQueryBuilder = (rows) => {
  // Construcción de la consulta GraphQL para el Push
  const query = `
  mutation PushTodo($input: PushTodoInput!) {
    pushTodo(input: $input) {
      todos {
        id
        text
        isCompleted
        createdAt
        updatedAt
        deleted
      }
    }
  }`;

  // Estructura de los datos enviados en la consulta
  const variables = {
    input: {
        writeRows: rows
    }
  };

  return {
    query,
    operationName: 'PushTodo',
    variables
  };
};
```

Cada row contiene dos llaves assumedMasterState (el estado anterior del todo) y newDocumentState (el estado actualizado del todo). El backend de Rails utiliza esta información para determinar si hay un conflicto (por ejemplo, si el todo ha sido modificado simultáneamente en otra instancia) y, en base a esto, actualiza la base de datos.


```module Mutations
  class PushTodo < BaseMutation
    # Definición de argumentos para la mutación
    argument :write_rows, [Types::TodoInputPushType], required: true
    field :todos, [Types::TodoType], null: false

    def resolve(write_rows:)
      # Lógica para procesar cada row y realizar actualizaciones o inserciones
      # ...
    end

    # Métodos privados para detectar conflictos y actualizar atributos
    # ...
  end
end
```

Con estas operaciones de Pull y Push, RXDB TODO asegura una sincronización efectiva entre el estado local de la aplicación y la base de datos en el backend de Rails, manejando eficientemente tanto la obtención de nuevos datos como la actualización de los mismos.

## 🖋️ Authors & Contributors<a name="authors"></a>

👤 **Daniel Carrera**

- GitHub: [@carreraprogrammer](https://github.com/carreraprogrammer)
- Twitter: [@carreraprogrammer](https://twitter.com/carreraprog)
- LinkedIn: [Daniel Carrera](https://www.linkedin.com/in/carreraprogrammer/)


## 🌟 Funciones Futuras <a name="future-features"></a>

- **Sincronización en Tiempo Real con WebSockets (WS)**: Para mejorar aún más la sincronización entre el cliente y el servidor, se planea implementar WebSockets. Esto permitirá una actualización inmediata de los datos en todos los clientes conectados tan pronto como se realice un cambio en la base de datos.

- **Autenticación de Usuarios**: A fin de proporcionar una experiencia de usuario se implementará en el piloto un sistema de autenticación.

Estas mejoras están diseñadas para hacer de RXDB TODO una herramienta de prueba de concepto más robusta y funcional, que pueda ser utilizada como base para el desarrollo de aplicaciones más complejas.

<p align="right">(<a href="#readme-top">back to top</a>)</p>

## 🆘 Soporte <a name="support"></a>

Si encuentras algún problema o tienes preguntas o sugerencias, por favor abre un issue en el [Issues](https://github.com/carreraprogrammer/rxdb-backend/issues).

Además, si deseas ponerte en contacto conmigo, puedes encontrar mi información de contacto en la sección de <a href="#authors">Autores</a>.

<p align="right">(<a href="#readme-top">volver arriba</a>)</p>

## 🌲 Agradecimientos <a name="acknowledgments"></a>

- **Cincoventicinco**: Por su confianza y oportunidades brindadas, facilitando un entorno propicio para el desarrollo y la innovación.
- **Pablo Aguero y Carlos Vargas**: Por su guía técnica, consejos prácticos y recursos contribuyendo significativamente al entendimiento de las tecnologias.

<p align="right">(<a href="#readme-top">back to top</a>)</p>

## 📄 License <a name="license"></a>

This project is [MIT](LICENSE) licensed.

<p align="right">(<a href="#readme-top">back to top</a>)</p>