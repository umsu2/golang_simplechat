package main

import (
	"log"
	"net/http"
	"github.com/gorilla/websocket"
	"sync"
	"encoding/json"
)

type Message struct {
	Email    string `json:"email"`
	Username string `json:"username"`
	Message  string `json:"message"`
	Chatroom string `json:"chatroom"`
	Action   string `json:"action"`
	Type   string `json:"type"`
}

//var clients = make(map[*websocket.Conn]bool)

//var chatrooms map[string](chan Message)

type chatrooms struct {
	data map[string](chan Message)
	mux  sync.Mutex
}

type User struct {

	name string `json:"username"`
	email string `json:"email"`
	//conn *websocket.Conn
}

var chatroom_singledton = chatrooms{data: make(map[string](chan Message))} // all these hashmaps can be unified into one
var chatroom_client_singleton = make(map[string]map[*websocket.Conn]bool)
var all_client_map = make(map[*websocket.Conn]*User)

func (r *chatrooms) Set(key string, ch chan Message) {
	r.mux.Lock()
	defer r.mux.Unlock()
	r.data[key] = ch
}

func (r *chatrooms) Get(key string) (chan Message, bool) {
	(*r).mux.Lock()
	defer (*r).mux.Unlock()
	val, ok := (*r).data[key]
	return val, ok
}

func (r *chatrooms) GetAllChanels() ([]chan Message) {
	(*r).mux.Lock()
	defer (*r).mux.Unlock()
	listofchanels := make([]chan Message, 0)
	for _, value := range r.data {

		listofchanels = append(listofchanels, value)
	}
	return listofchanels
}

func (r *chatrooms) GetAllChanelNames() ([]string) {
	(*r).mux.Lock()
	defer (*r).mux.Unlock()

	var listofchanelnames []string
	for name, _ := range r.data {

		listofchanelnames = append(listofchanelnames, name)
	}
	return listofchanelnames
}

//var broadcast = make(chan Message)
var upgrader = websocket.Upgrader{

	CheckOrigin: func(r *http.Request) bool {
		return true
	},
}

func main() {

	//fs := http.FileServer(http.Dir("../public"))
	//http.Handle("/",fs)
	http.HandleFunc("/", handleConnections)
	//go handleMessages()
	log.Println("websocket server started on :8080")
	err := http.ListenAndServe(":8080", nil)
	if err != nil {
		log.Fatal("ListenAndServe: ", err)

	}

}

func handleConnections(w http.ResponseWriter, r *http.Request) {

	ws, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Fatal(err)
	}
	defer ws.Close()
	// map of room -> map
	all_client_map[ws] = &User{}
	//clients[ws] = true // need to have a mapping of rooms to hashmap of sockets. , then iterate through hashmap and call get

	for {
		var msg Message

		err := ws.ReadJSON(&msg)

		if err != nil {
			log.Printf("error: %v", err)

			deleteClientWSConn(ws)
			break
		}

		if msg.Action == "create" {
			chatroom := make(chan Message)
			(&chatroom_singledton).Set(msg.Chatroom, chatroom)

			room_list_in_json, err := json.Marshal(chatroom_singledton.GetAllChanelNames());

			if(err==nil){
				room_list_msg := Message{Action:"result", Type:"rooms", Message: string(room_list_in_json)}

				for conn, _ := range all_client_map{

				go notifyClient(conn, room_list_msg)


				}}

			go handleMessagesPerChanel(chatroom)
			// todo maybe after the user has created the room, force user to join the created room.




		} else if msg.Action == "join" {

			_, ok := (&chatroom_singledton).Get(msg.Chatroom)
			if (ok) { // there exists a chatroom

				chatroom_client_map, ok := chatroom_client_singleton[msg.Chatroom]

				if (!ok) { // there exists a map for that room

					connectionMap := make(map[*websocket.Conn]bool)
					chatroom_client_singleton[msg.Chatroom] = connectionMap
					chatroom_client_map = connectionMap
				}

				user,_ := all_client_map[ws]
				(*user).email = msg.Email
				(*user).name = msg.Username
				chatroom_client_map[ws] = true


			}

			//todo maybe notify the rest , someone has joined?

		} else if msg.Action == "message" {

			chatroom, ok := (&chatroom_singledton).Get(msg.Chatroom)

			if (ok) {
				chatroom <- msg

			}
			// else the chat room doesn't exist
		} else if msg.Action == "get" {
			// this is global action, so it will just return back a list
			if msg.Type == "rooms"{ //todo this could be cached.


				room_list_in_json, err := json.Marshal(chatroom_singledton.GetAllChanelNames());

				if(err==nil){
					room_list_msg := Message{Action:"result", Type:"rooms", Message: string(room_list_in_json)}

					//for _, rooms_dict := range chatroom_client_singleton{
					//	for conn, _ := range rooms_dict{
							go notifyClient(ws, room_list_msg)

						//}
					//}
				}


			} else if msg.Type == "users" { // when client asks for users. or have server push user upon user joining? when user join, server needs to broadcast user to those in that room, so it's server side pushing info

				users_list_in_json, err := json.Marshal(GetAllUsersInRoom(msg.Chatroom));

				if(err==nil){
					user_list_msg := Message{Action:"result", Type:"users", Message: string(users_list_in_json)}

					go notifyClient(ws, user_list_msg)

				}

			}




		}

		//broadcast <- msg

	}

}

func GetAllUsersInRoom(chatroom_name string) []User {
	chatroom_client_map, ok := chatroom_client_singleton[chatroom_name]
	list_of_users := make([]User,0)
	if(ok && len(chatroom_client_map) > 0 ){


		 for client , _ :=  range chatroom_client_map{
			 userptr, _ := all_client_map[client] // clients should be in the overall hashmap
			 list_of_users = append(list_of_users,*userptr)
		}

		//for each client in that particular room , look up its user obj, return as list

	}
	return list_of_users


}

func notifyClient(conn *websocket.Conn, msg Message) error {

	err := conn.WriteJSON(msg)
	if err != nil {
		log.Printf("error: %v", err)
		conn.Close()
		deleteClientWSConn(conn)
	}

	return err

}

func deleteClientWSConn(conn *websocket.Conn) {

	for _, rooms_dict := range chatroom_client_singleton {

		_, ok := rooms_dict[conn]
		if (ok) {
			delete(rooms_dict, conn)
		}
	}
	delete(all_client_map,conn)
}

func handleMessagesPerChanel(msgchan chan Message) {

	for {
		msg := <-msgchan

		room := msg.Chatroom

		clients, ok := chatroom_client_singleton[room]
		if (ok) {

			for client, _ := range clients {

				go notifyClient(client,msg)

			}

		}

	}

}
