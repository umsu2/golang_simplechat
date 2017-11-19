new Vue({

        el: '#app',

        data: {

            ws: null,
            newMsg: '',
            chatContent: '',
            chatRooms: [],
            usersinCurrentRoom: ["None"],
            email: null,
            username: null,
            ChatroomName: null,
            currentChatroom: "",
            joined: false,

        },

        created: function () {

            var self = this;

            self.ws = new WebSocket(`ws://${window.location.hostname}/ws`);

            self.ws.addEventListener('open', function () {

                self.ws.send(
                    JSON.stringify({

                        action: "get",
                        type: "rooms",

                    }));
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

                }



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
                // this.chatRooms.push(chatroomName);
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