$( function() {
    $('#autojoinmodal').modal({
            dismissible: false, // Modal can be dismissed by clicking outside of the modal

            ready: function(modal, trigger) { // Callback for Modal open. Modal and trigger parameters available.
                console.log(modal, trigger);

            },


        }
    );
    $('#autojoinmodal').modal('open');



    $(".chatmessagearea").emojioneArea({
        pickerPosition: "bottom",
        tonesStyle: "bullet",
        events: {
            keyup: function(editor, event) {
                // catches everything but enter
                if (event.which == 13) {
                    
                    vm.send();




                } else {

                }
            }

        },

    });


});

