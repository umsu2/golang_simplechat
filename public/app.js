new Vue({

        el: '#app',

        data: {

            ws: null,
            newMsg: '',
            chatContent: '',
            chatRooms: [],
            email: null,
            username: null,
            ChatroomName: null,
            currentChatroom: "",
            joined: false,


        },

        created: function () {

            var self = this;

            self.ws = new WebSocket('ws://localhost:8000/ws');
            this.ws.addEventListener('message', function (e) {// todo handle multiple type of messages, need message type of "get chat rooms" , so the server pushes the list of rooms to each client

                var msg = JSON.parse(e.data);
                self.chatContent +=

                    `<div class="chip">   <img src="${ self.gravatarURL(msg.email) } ">   ${msg.username}     </div>     ${emojione.toImage(msg.message)} <br> `;

                var element = document.getElementById('chat-messages');
                element.scrollTop = element.scrollHeight;

            });


        },

        methods: {

            send: function () {
                if (this.newMsg != '') {
                    this.ws.send(
                        JSON.stringify({
                            email: this.email,
                            action: "message",
                            username: this.username,
                            chatroom: this.currentChatroom,
                            message: $('<p>').html(this.newMsg).text()
                        }));
                    this.newMsg = '';
                }
            },

            join: function () {

                if (!this.email) {
                    Materialize.toast('You must enter an email', 2000);
                    return
                }
                if (!this.username) {
                    Materialize.toast('You must choose a username', 2000);
                    return
                }
                if (!this.currentChatroom) {
                    Materialize.toast('You must join a chatroom', 2000);
                    return
                }

                this.email = $('<p>').html(this.email).text();
                this.username = $('<p>').html(this.username).text();

                this.ws.send(
                    JSON.stringify({
                        action : 'join',
                        chatroom : this.currentChatroom,

                    }));


                this.joined = true;
            },

            createChatroom: function () {

                var chatroomName = $('<p>').html(this.ChatroomName).text();
                if (!this.ChatroomName) {
                    Materialize.toast('You must create a chatroom', 2000);
                    return
                }
                this.chatRooms.push(chatroomName);
                this.ws.send(
                        JSON.stringify({
                            action : 'create',
                            chatroom : chatroomName,

                        }));
                this.ChatroomName = '';
                Materialize.toast(`You created a chatroom called: '${chatroomName}'`, 2000);




            },

            gravatarURL: function (email) {
                return 'http://www.gravatar.com/avatar/' + CryptoJS.MD5(email);
            }


        },

    }
);