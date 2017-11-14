package main

import (
	"log"
	"net/http"
	"github.com/gorilla/websocket"
	"sync"

)

type Message struct {

	Email 		string `json:"email"`
	Username 	string `json:"username"`
	Message 	string `json:"message"`
	Chatroom	string `json:"chatroom"`
	Action 		string `json:"action"`

}


var clients = make(map[*websocket.Conn]bool)

//var chatrooms map[string](chan Message)

type chatrooms struct{
	data map[string](chan Message)
	mux sync.Mutex
}

var chatroom_singledton = chatrooms{data: make(map[string](chan Message))}


func (r *chatrooms) Set(key string, ch chan Message){
	r.mux.Lock()
	defer r.mux.Unlock()
	r.data[key] = ch
}

func (r *chatrooms) Get(key string) (chan Message, bool ) {
	(*r).mux.Lock()
	defer (*r).mux.Unlock()
	val, ok := (*r).data[key]
	return val, ok
}

func (r *chatrooms) GetAll() ([]chan Message) {
	(*r).mux.Lock()
	defer (*r).mux.Unlock()
	listofchanels := make([]chan Message,0)
	for _,value := range r.data{

		listofchanels = append(listofchanels, value)
	}
	return listofchanels
}


var broadcast = make(chan Message)
var upgrader = websocket.Upgrader{

	CheckOrigin: func(r *http.Request) bool {
		return true
	},


}

func main()  {

	//fs := http.FileServer(http.Dir("../public"))
	//http.Handle("/",fs)
	http.HandleFunc("/ws", handleConnections)
	//go handleMessages()
	log.Println("http server started on :8000")
	err := http.ListenAndServe(":8000",nil)
	if err != nil {
		log.Fatal("ListenAndServe: ", err)

	}


}


func handleConnections(w http.ResponseWriter , r *http.Request) {

	ws, err := upgrader.Upgrade(w,r,nil)
	if err != nil {
		log.Fatal(err)
	}
	defer ws.Close()
	clients[ws] = true // need to have a mapping of rooms to hashmap of sockets. , then iterate through hashmap and call get

	for {
		var msg Message


		err := ws.ReadJSON(&msg)

		if err!= nil{
			log.Printf("error: %v", err)
			delete(clients, ws)
			break
		}

		if msg.Action == "create"{
			chatroom := make(chan Message)
			(&chatroom_singledton).Set(msg.Chatroom, chatroom)
			go handleMessagesPerChanel(chatroom)

		} else {

			chatroom, ok := (&chatroom_singledton).Get(msg.Chatroom)

			if(ok){
				chatroom <-msg


			}
			// else the chat room doesn't exist
		}

		//broadcast <- msg

	}


}

//func handleMessages(){
//	//for {
//
//		//msg := <-broadcast
//
//		var rooms = chatroom_singledton.GetAll()
//
//		for _, room := range rooms{
//
//			go handleMessagesPerChanel(room)
//		}
//
//
//		//}
//
//}

func handleMessagesPerChanel(msgchan chan Message){


	for{
		msg := <-msgchan

		for client := range clients {

			err:= client.WriteJSON(msg)
			if err != nil {
				log.Printf("error: %v", err)
				client.Close()
				delete(clients,client)

			}

		}
	}


}
