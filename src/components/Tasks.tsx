import React, { useState, useEffect } from 'react';
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent,
  IonList, IonItem, IonLabel, IonInput, IonButton,
  IonItemSliding, IonItemOptions, IonItemOption, IonCheckbox
} from '@ionic/react';
import { useDb } from './dbContext';

const Tasks = () => {
  const [tasks, setTasks] = useState([]);
  const [newTask, setNewTask] = useState('');
  const [editingTaskId, setEditingTaskId] = useState(null);
  const [editingText, setEditingText] = useState('');
  const db = useDb();

  const loadTasks = async () => {
    if (db) {
      const allTasks = await db.todos.find().exec();
      setTasks(allTasks);
    }
  };

  const getNextTaskId = () => {
    if (tasks.length === 0) {
      return 0;
    }
    const maxId = tasks.reduce((max, task) => Math.max(max, parseInt(task.id)), 0);
    return maxId + 1;
  };

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

  const startEditTask = (task) => {
    setEditingTaskId(task.id);
    setEditingText(task.text);
  };

  const confirmEditTask = async () => {
    if (editingTaskId && editingText.trim()) {
      const taskToUpdate = await db.todos.findOne(editingTaskId).exec();
      if (taskToUpdate) {
        await taskToUpdate.update({
          $set: {
            text: editingText,
            updatedAt: new Date().toISOString()
          }
        });
        setEditingTaskId(null);
        setEditingText('');
        loadTasks();
      }
    }
  };

  const cancelEditTask = () => {
    setEditingTaskId(null);
    setEditingText('');
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

  const deleteTask = async (id) => {
    const taskToDelete = await db.todos.findOne(id).exec();
    if (taskToDelete) {
      await taskToDelete.remove();
      loadTasks();
    }
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
                {editingTaskId === task.id ? (
                  <IonInput 
                    value={editingText} 
                    onIonChange={(e) => setEditingText(e.detail.value)} 
                  />
                ) : (
                  <IonLabel onClick={() => startEditTask(task)}>
                    {task.text}
                  </IonLabel>
                )}
                <IonCheckbox 
                  slot="end"
                  checked={task.isCompleted}
                  onIonChange={() => toggleCompleteTask(task)}
                  aria-label={`Marcar tarea "${task.text}" como completada`}
                />
              </IonItem>
              <IonItemOptions side="end">
                {editingTaskId === task.id ? (
                  <>
                    <IonItemOption onClick={confirmEditTask} color="success">Guardar</IonItemOption>
                    <IonItemOption onClick={cancelEditTask} color="light">Cancelar</IonItemOption>
                  </>
                ) : (
                  <IonItemOption onClick={() => deleteTask(task.id)} color="danger">Eliminar</IonItemOption>
                )}
              </IonItemOptions>
            </IonItemSliding>
          ))}
        </IonList>
        <IonItem>
          <IonInput value={newTask} placeholder="Nueva tarea" onIonChange={(e) => setNewTask(e.detail.value)}></IonInput>
        </IonItem>
        <IonButton expand="full" onClick={addTask}>Añadir Tarea</IonButton>
      </IonContent>
    </IonPage>
  );
};

export default Tasks;
