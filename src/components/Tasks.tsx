import React, { useState, useEffect } from 'react';
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent,
  IonList, IonItem, IonLabel, IonInput, IonButton,
  IonItemSliding, IonItemOptions, IonItemOption, IonAlert,
  IonCheckbox
} from '@ionic/react';
import { useDb } from './dbContext';

const Tasks = () => {
  const [tasks, setTasks] = useState([]);
  const [newTask, setNewTask] = useState('');
  const [editTask, setEditTask] = useState(null);
  const db = useDb();

  // Cargar tareas desde la base de datos
  const loadTasks = async () => {
    if (db) {
      const allTasks = await db.todos.find().exec();
      setTasks(allTasks);
    }
  };

  // Obtener el próximo ID para una nueva tarea
  const getNextTaskId = () => {
    if (tasks.length === 0) {
      return 0;
    }
    const maxId = tasks.reduce((max, task) => Math.max(max, parseInt(task.id)), 0);
    return maxId + 1;
  };

  // Agregar una nueva tarea
  const addTask = async () => {
    if (newTask.trim()) {
      await db.todos.insert({
        id: getNextTaskId().toString(),
        text: newTask,
        isCompleted: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      setNewTask('');
      loadTasks();
    }
  };

  // Editar una tarea
  const confirmEditTask = async () => {
    if (editTask && editTask.id && editTask.text.trim()) {
      const taskToUpdate = await db.todos.findOne(editTask.id).exec();
      if (taskToUpdate) {
        await taskToUpdate.update({
          $set: {
            text: editTask.text,
            updatedAt: new Date().toISOString()
          }
        });
        setEditTask(null);
        loadTasks();
      }
    }
  };

  const toggleCompleteTask = async (task) => {
    const taskToToggle = await db.todos.findOne(task.id).exec();
    if (taskToToggle) {
      await taskToToggle.update({
        $set: {
          isCompleted: !taskToToggle.isCompleted
        }
      });
      loadTasks();
    }
  };

  // Eliminar una tarea
  const deleteTask = async (id) => {
    const taskToDelete = await db.todos.findOne(id).exec();
    if (taskToDelete) {
      await taskToDelete.remove();
      loadTasks();
    }
  };

  // Eliminar tareas completadas
  const deleteCompletedTasks = async () => {
    const tasksToDelete = await db.todos.find({ isCompleted: true }).exec();
    for (let task of tasksToDelete) {
      await task.remove();
    }
    loadTasks();
  };

  useEffect(() => {
    loadTasks();
  }, [db]);

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Tareas</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding"> 
      <IonList>
        {tasks.map((task) => (
          <IonItemSliding key={task.id}>
            <IonItem style={{ backgroundColor: task.isCompleted ? '#e6f5d0' : '' }}>
              <IonLabel onClick={() => setEditTask({ id: task.id, text: task.text })}>
                {task.text}
              </IonLabel>
              <IonCheckbox 
                slot="end"
                checked={task.isCompleted}
                onIonChange={() => toggleCompleteTask(task)}
                aria-label="Marcar tarea como completada" // Añade un aria-label adecuado
              />
            </IonItem>
            <IonItemOptions side="end">
              <IonItemOption onClick={() => deleteTask(task.id)} color="danger">Eliminar</IonItemOption>
            </IonItemOptions>
          </IonItemSliding>
        ))}
      </IonList>
        <IonItem>
          <IonInput value={newTask} placeholder="Nueva tarea" onIonChange={(e) => setNewTask(e.detail.value)}></IonInput>
        </IonItem>
        <IonButton expand="full" onClick={addTask}>Añadir Tarea</IonButton>
        <IonAlert
          isOpen={!!editTask}
          header={'Editar Tarea'}
          inputs={[{
            name: 'text',
            type: 'text',
            value: editTask?.text,
            placeholder: 'Escribe la tarea'
          }]}
          buttons={[
            {
              text: 'Cancelar',
              role: 'cancel',
              handler: () => setEditTask(null)
            },
            {
              text: 'Guardar',
              handler: (alertData) => {
                setEditTask(prev => ({ ...prev, text: alertData.text }));
                confirmEditTask();
              }
            }
          ]}
        />
      </IonContent>
    </IonPage>
  );
};

export default Tasks;
