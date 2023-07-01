import React, {useEffect} from "react";
import TodoList from "./Todo/TodoList";
import Context from "./context";
import Loader from "./Loader";
import Modal from "./Modal/Modal";

//const AddTodo = React.lazy(()=> import('./Todo/AddTodo'))
const AddTodo = React.lazy(()=>new Promise(resolve => {
    setTimeout(()=>{
        resolve(import('./Todo/AddTodo'))
    }, 1500)
}))

function App() {
    const [todos, setTodos] = React.useState([])
    const [loading, setLoader] = React.useState(true)

    useEffect(() => {
        fetch('https://jsonplaceholder.typicode.com/todos?_limit=10')
            .then(response => response.json())
            .then(json => {
                setTimeout(() => {
                    setTodos(json)
                    setLoader(false)
                }, 2000)
            })
    }, [])

    function togoToggle(id) {
        setTodos(
            todos.map(todo => {
                if (todo.id === id) {
                    todo.completed = !todo.completed
                }
                return todo
            })
        )
    }

    function removeTodo(id) {
        setTodos(todos.filter(todo => todo.id !== id))
    }

    function addTodo(title) {
        setTodos(todos.concat([{
            title,
            id: Date.now(),
            completed: false
        }]))
    }

    return (
        <Context.Provider value={{removeTodo}}>
            <div className='wrapper'>
                <h1>Super Cool React APP</h1>
                <Modal></Modal>
                <React.Suspense fallback={<p>AddTODO component is loading . . .</p>}>
                    <AddTodo onCreate={addTodo}></AddTodo>
                </React.Suspense>

                {loading && <Loader></Loader>}
                {todos.length ? (
                    <TodoList todos={todos} checkboxToggle={togoToggle}></TodoList>
                ) : (
                    loading ? null : <p>No todos!</p>
                )
                }

            </div>
        </Context.Provider>
    );
}

export default App;
