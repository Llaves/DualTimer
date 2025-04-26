        if ("serviceWorker" in navigator) {
            navigator.serviceWorker.register("service-worker.js")
                .then(() => console.log("Service Worker Registered"));
        }

        // Get DOM elements
        const timer1Input = document.getElementById('timer1');
        const timer2Input = document.getElementById('timer2');
        const p1Button = document.getElementById('p1Button');
        const p2Button = document.getElementById('p2Button');
        const p3Button = document.getElementById('p3Button');
        const wrapper = document.querySelector('.wrapper');
        const countdownCircle = document.getElementById('countdown-circle');

        let alarm = document.getElementById("alarm");
        let tickSound = document.getElementById("tickSound");

        let programs = {
            1: { timer1: 5, timer2: 30 },
            2: { timer1: 30, timer2: 0 },
            3: { timer1: 30, timer2: 10 } // Default values, will load from storage
        };
        let currentProgram = 1;
        let lastTimer = ""; // Keep track of the last active timer
        let remainingTime1 = 0;
        let remainingTime2 = 0;

        // Load settings from localStorage
        function loadSettings() {
            // Load program settings
            for (let i = 1; i <= 3; i++) {
                let savedProgram = localStorage.getItem(`program${i}`);
                if (savedProgram) {
                    programs[i] = JSON.parse(savedProgram);
                }
            }


            selectProgram(parseInt(localStorage.getItem('lastProgram', 1) || 1));
            updateCountdownCircleSize(); // Initial size
        }

        function saveSettings() {
            for (let i = 1; i <= 3; i++) {
                localStorage.setItem(`program${i}`, JSON.stringify(programs[i]));
            }
            localStorage.setItem('lastProgram', currentProgram);
        }

        function selectProgram(programNumber) {
            // Deselect all buttons
            p1Button.classList.remove('selected');
            p2Button.classList.remove('selected');
            p3Button.classList.remove('selected');

            // Select the current button
            document.getElementById(`p${programNumber}Button`).classList.add('selected');

            currentProgram = programNumber;
            timer1Input.value = programs[currentProgram].timer1;
            timer2Input.value = programs[currentProgram].timer2;
            saveSettings();
            countdownCircle.textContent = programs[currentProgram].timer1;
        }

        // Save timer values when they change
        timer1Input.addEventListener('change', () => {
            programs[currentProgram].timer1 = parseInt(timer1Input.value) || 0;
            saveSettings();
        });

        timer2Input.addEventListener('change', () => {
            programs[currentProgram].timer2 = parseInt(timer2Input.value) || 0;
            saveSettings();
        });

        // Preload the alarm sound and unmute it
        window.onload = function () {
            loadSettings();
            alarm.load(); // Preload the audio
            tickSound.load();
            updateCountdownCircleSize();
            window.addEventListener('resize', updateCountdownCircleSize);
            countdownCircle.textContent = programs[currentProgram].timer1;
        };

        function updateCountdownCircleSize() {
            let wrapperWidth = wrapper.offsetWidth;
            let wrapperHeight = wrapper.offsetHeight;
            let circleSize = Math.max(wrapperWidth, wrapperHeight) * .8; // Slightly larger

            countdownCircle.style.width = `${circleSize}px`;
            countdownCircle.style.height = `${circleSize}px`;
        }

        function startTimers() {
            alarm.muted = false;
            tickSound.muted = false;
            if (running) return;
        
            // Toggle running state
            running = !running;
        
            // Toggle pause state only if we're stopping the timer
            if (!running) {
                paused = true;
                document.getElementById("startButton").innerText = "Resume";
                document.getElementById('status').innerText = "Timers paused.";
                tickSound.pause();  // Keep the pause here, but only if STOPPING
                console.log("startTimers: Setting paused to true, exiting"); // Added log
                return; //Very important to exit here, after the pause button has been pressed.
            }
        
            document.getElementById("startButton").innerText = "Start";  //reset the text after the toggle is pressed.
            document.getElementById('status').innerText = "";
            console.log("startTimers: Paused flag before cycleTimers: ", paused); //Added Log
        
            cycleTimers(paused);
        }

        function playAlarm(callback) {
            if (!running) return;
            alarm.muted = false;
            alarm.play();
            document.getElementById('status').innerText = "Alarm!";
            setTimeout(() => {
                alarm.pause();
                alarm.currentTime = 0; // Reset to the beginning of the sound
                if (running) callback();
            }, 1000);
        }

        let running = false;
        let paused = false;
        let remainingTime = 0;
        let currentTimer = "";

        function stopTimers() {
            running = false;
            paused = true;
            document.getElementById("startButton").innerText = "Resume";
            document.getElementById('status').innerText = "Timers paused.";
            //tickSound.pause();
        }

        function resetTimers() {
            running = false;
            paused = false;
            remainingTime = 0;
            document.getElementById("startButton").innerText = "Start";
            document.getElementById('status').innerText = "Timers reset.";
            tickSound.pause();
            countdownCircle.textContent = programs[currentProgram].timer1;
            remainingTime1 = 0;
            remainingTime2 = 0;
            lastTimer = "";
        }

        function cycleTimers(paused) { //PASSED Paused here
            if (!running) return;
        
            let timer1 = programs[currentProgram].timer1;
            let timer2 = programs[currentProgram].timer2;
        
            // Determine which timer to start based on lastTimer
            if (paused) {
                //paused = false; // Reset paused state
        
                if (lastTimer === "Timer 1") {
                    runTimer("Timer 1", remainingTime1, paused, () => { //PASSED Paused here
                        timer2Sequence(programs[currentProgram].timer2, paused);
                    });
                } else if (lastTimer === "Timer 2") {
                    runTimer("Timer 2", remainingTime2, paused, () => { //PASSED Paused here
                        timer1Sequence(timer1, paused);
                    });
                } else {
                    // If no timer was running before pause, start with Timer 1
                    timer1Sequence(timer1, paused);
                }
            } else {
                // If not paused, start with Timer 1
                timer1Sequence(timer1, paused);
            }
        }

        function timer1Sequence(timer1, paused) { //PASSED Paused here
            runTimer("Timer 1", timer1, paused, () => { //PASSED Paused here
                if (running && timer1 > 0) {
                    playAlarm(() => {
                        timer2Sequence(programs[currentProgram].timer2, paused);
                    });
                } else if (running) {
                    timer2Sequence(programs[currentProgram].timer2, paused);
                }
            });
        }
        
        function timer2Sequence(timer2, paused) { //PASSED Paused here
            runTimer("Timer 2", timer2, paused, () => { //PASSED Paused here
                if (running && timer2 > 0) {
                    playAlarm(() => {
                        cycleTimers(paused);
                    });
                } else if (running) {
                    cycleTimers(paused);
                }
            });
        }
        function runTimer(timerName, seconds, paused, callback) { //PASSED Paused here.
            console.log("runTimer: paused flag at start: ", paused); // Added Log
            if (!running) {
                console.log("runTimer: Not running, pausing tickSound and returning");
                tickSound.pause();
                console.log("runTimer: tickSound paused");
                callback();
                return;
            }
        
            lastTimer = timerName;
            currentTimer = timerName;
            remainingTime = seconds;
            updateCountdownCircle(seconds);
        
            if (!paused) {
                console.log("runTimer: Not paused, resetting tickSound.currentTime to 0");
                tickSound.currentTime = 0;
                console.log("runTimer: tickSound.currentTime reset to 0");
            }
        
            if (seconds > 0) {
                console.log("runTimer: Seconds > 0, playing tickSound");
                tickSound.play();
                console.log("runTimer: tickSound playing");
            }
        
            document.getElementById('status').innerText = `${timerName}: running`;
        
            let countdown = setInterval(() => {
                if (!running) {
                    clearInterval(countdown);
                    console.log("runTimer: Timer stopped, pausing tickSound");
                    tickSound.pause();
                    console.log("runTimer: tickSound paused");
                    if (timerName === "Timer 1") {
                        remainingTime1 = seconds;
                    } else if (timerName === "Timer 2") {
                        remainingTime2 = seconds;
                    }
                    return;
                }
                if (seconds <= 1) {
                    clearInterval(countdown);
                    remainingTime = 0;
                    console.log("runTimer: Timer finished, pausing tickSound");
                    tickSound.pause();
                    console.log("runTimer: tickSound paused");
                    updateCountdownCircle("");
        
                    if (timerName === "Timer 1") {
                        remainingTime1 = 0;
                    } else if (timerName === "Timer 2") {
                        remainingTime2 = seconds;
                    }
        
                    if (paused) {
                        if (running) {
                            playAlarm(callback);
                        } else {
                            callback();
                        }
                    } else {
                        callback();
                    }
                } else {
                    seconds--;
                    updateCountdownCircle(seconds);
                    remainingTime = seconds;
                    if (timerName === "Timer 1") {
                        remainingTime1 = seconds;
                    } else if (timerName === "Timer 2") {
                        remainingTime2 = seconds;
                    }
                }
            }, 1000);
        }
        
        function stopTimers() {
            running = false;
            paused = true;
            document.getElementById("startButton").innerText = "Resume";
            document.getElementById('status').innerText = "Timers paused.";
            console.log("stopTimers: Pausing tickSound");
            tickSound.pause();
            console.log("stopTimers: tickSound paused");
        }

        function updateCountdownCircle(seconds) {
            countdownCircle.textContent = seconds;
        }