# golang_simplechat
creating a simple chat app through golang


view demo at:

www.rubberducklings.com

how to run the app locally:
- install docker, docker-compose
- `docker-compose build`
- `docker-compose up`
- goto localhost


how to setup dev environment:

- sudo vim `/etc/hosts`
- add record - `127.0.0.1   app`
- install nginx locally, add a config in `sites-enabled` config defined in `nginx.conf`
- or just overwrite local `nginx.conf` with `nginx.conf` 




#todos

functionalities:
- [x] users can switch chat rooms
- [ ] ~~if last user leaves a chatroom, it will disappear, except for public room~~
- [x] easier emoji access, user can see all available emojis
- [x] user joins or leaves a room, msg will broadcast to the users in the room
- [x] a user list, where the chatroom shows who is inside the room
- [ ] private msg between users
- [x] once ws timeouts, indicate timeout and button to reconnect
- [x] nginx ws no socket timeout
- [ ] when user joins they see previous n (5?) chat msg if available
- [ ] some db logging
- [ ] secure, wss and https on nginx

deployment:
- [ ] git commit triggers build.
- [ ] auto deployment. 

