import React, { useState } from 'react';
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent,
  IonList, IonItem, IonLabel, IonInput, IonButton,
  IonItemSliding, IonItemOptions, IonItemOption, IonCheckbox
} from '@ionic/react';
import { useObservableState } from 'observable-hooks';
import { useDb } from './dbContext';

const Tasks = () => {
  const [newTask, setNewTask] = useState('');
  const [editingTaskId, setEditingTaskId] = useState(null);
  const [editingText, setEditingText] = useState('');
  const db: any = useDb();

  const tasks$ = db ? db.todos.find().sort({createdAt: 'desc'}).$ : null;
  const tasks = useObservableState(tasks$, []);

  const addTask = async () => {
    if (newTask.trim()) {
      const newId = Date.now().toString(); // Generando un ID único
      await db.todos.insert({
        id: newId, // Asegurando que cada tarea tenga un ID único
        text: newTask,
        isCompleted: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      setNewTask('');
    }
  };

  const startEditTask = (task: any) => {
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
      }
    }
  };

  const cancelEditTask = () => {
    setEditingTaskId(null);
    setEditingText('');
  };

  const toggleCompleteTask = async (task: any) => {
    const taskToToggle = await db.todos.findOne(task.id).exec();
    if (taskToToggle) {
      console.log('Changing task: ' + taskToToggle.id + ' ' + taskToToggle.isCompleted);
      await taskToToggle.update({
        $set: {
          isCompleted: !taskToToggle.isCompleted
        }
      });
      console.log('Changed task: ' + taskToToggle.id + ' ' + taskToToggle.isCompleted);
    }
  };

  const deleteTask = async (id: any) => {
    const taskToDelete = await db.todos.findOne(id).exec();
    if (taskToDelete) {
      await taskToDelete.remove();
    }
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Tareas</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <IonList>
          {tasks.map((task: any) => (
            <IonItemSliding key={task.id}>
              <IonItem style={{ backgroundColor: task.isCompleted ? '#e6f5d0' : '' }}>
                {editingTaskId === task.id ? (
                  <IonInput 
                    value={editingText} 
                    onIonChange={(e: any) => setEditingText(e.detail.value)} 
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
          <IonInput value={newTask} placeholder="Nueva tarea" onIonChange={(e: any) => setNewTask(e.detail.value)}></IonInput>
        </IonItem>
        <IonButton expand="full" onClick={addTask}>Añadir Tarea</IonButton>
      </IonContent>
    </IonPage>
  );
};

export default Tasks;
