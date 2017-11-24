

new Vue({

        el: '#app',

        data: {

            ws: null,
            // newMsg: '',
            chatContent: '',
            chatRooms: [],
            usersinCurrentRoom: ["None"],
            email: null,
            username: null,
            ChatroomName: null,
            currentChatroom: "",
            modaltype: "connect",

        },

        created: function () {

            var self = this;

            self.ws = new WebSocket(`ws://${window.location.hostname}/ws`);

            self.ws.addEventListener('open', function () {

                // once socket is open, grab the initial list of rooms
                self.ws.send(
                    JSON.stringify({

                        action: "get",
                        type: "rooms",

                    }));



            });

            this.ws.addEventListener('close', function (e) {

                self.modaltype = "disconnect";

                $('#autojoinmodal').modal({
                        dismissible: false, // Modal can be dismissed by clicking outside of the modal
                        complete: function() {

                            location.reload();

                        },
                        ready: function(modal, trigger) { // Callback for Modal open. Modal and trigger parameters available.
                            console.log(modal, trigger);

                        },
                    }
                );
                $('#autojoinmodal').modal('open');

            });

            this.ws.addEventListener('message', function (e) {



                var msg = JSON.parse(e.data);

                if(msg.action === "message"){

                    self.chatContent +=

                        `<div class="chip">   <img src="${ self.gravatarURL(msg.email) } ">   ${msg.username}     </div>     ${emojione.toImage(msg.message)} <br> `;

                    var element = document.getElementById('chat-messages');
                    element.scrollTop = element.scrollHeight;
                }

                else if (msg.action === "result"){
                    if (msg.type === "rooms"){

                        chatrooms = JSON.parse(msg.message);
                        self.chatRooms = chatrooms
                    }
                    else if( msg.type === "current_room"){
                        chatroom = msg.message;
                        self.currentChatroom = chatroom
                    }
                    else if( msg.type === "users"){
                        users =  JSON.parse(msg.message);
                        self.usersinCurrentRoom = users;
                    }

                }



            });


        },

        methods: {

            send: function () {
                // if (this.newMsg != '' ) {
                var chatTxtBoxText = $(".chatmessagearea").val();
                if ( chatTxtBoxText != ''  ) {
                    this.ws.send(
                        JSON.stringify({
                            email: this.email,
                            action: "message",
                            username: this.username,
                            chatroom: this.currentChatroom,
                            message: $('<p>').html(chatTxtBoxText).text()
                        }));

                    $(".chatmessagearea")[0].emojioneArea.setText('');
                    // this.newMsg = '';
                }
            },

            user_entry: function() {

                if (!this.email) {
                    Materialize.toast('You must enter an email', 2000);
                    return
                }
                if (!this.username) {
                    Materialize.toast('You must choose a username', 2000);
                    return
                }
                this.email = $('<p>').html(this.email).text();
                this.username = $('<p>').html(this.username).text();

                this.ws.send(
                    JSON.stringify({
                        email: this.email,
                        username: this.username,
                        action : 'user_entry'
                    }));

                this.ws.send(
                    JSON.stringify({

                        action: "get",
                        type: "current_room",

                    }));


                this.ws.send(
                    JSON.stringify({

                        action: "get",
                        type: "users",

                    }));

                $("#autojoinmodal").modal('close');
            },

            join: function (room_name) {



                this.ws.send(
                    JSON.stringify({
                        action : 'join',
                        chatroom : room_name,

                    }));
                Materialize.toast('You joined the room: ' + room_name, 2000);



            },

            opencreateChatroommodal: function(){

                this.modaltype = "createchatroom";
                $("#autojoinmodal").modal('open');

            },

            createChatroom: function () {

                var chatroomName = $('<p>').html(this.ChatroomName).text();
                if (!this.ChatroomName) {
                    Materialize.toast('You must create a chatroom', 2000);
                    return
                }
                // this.chatRooms.push(chatroomName);
                this.ws.send(
                        JSON.stringify({
                            action : 'create',
                            chatroom : chatroomName,

                        }));
                this.ChatroomName = '';
                Materialize.toast(`You created a chatroom called: '${chatroomName}'`, 2000);
                $("#autojoinmodal").modal('close');



            },

            gravatarURL: function (email) {
                return 'http://www.gravatar.com/avatar/' + CryptoJS.MD5(email);
            }


        },

    }
);