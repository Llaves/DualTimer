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
            running = true;
            document.getElementById("startButton").innerText = "Start";
            cycleTimers();
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
            tickSound.pause();
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

        function cycleTimers() {
            if (!running) return;

            let timer1 = programs[currentProgram].timer1;
            let timer2 = programs[currentProgram].timer2;

            // Determine which timer to start based on lastTimer
            if (paused) {
                paused = false; // Reset paused state

                if (lastTimer === "Timer 1") {
                    runTimer("Timer 1", remainingTime1, () => {
                        timer2Sequence(programs[currentProgram].timer2);
                    });
                } else if (lastTimer === "Timer 2") {
                    runTimer("Timer 2", remainingTime2, () => {
                        timer1Sequence(timer1);
                    });
                } else {
                    // If no timer was running before pause, start with Timer 1
                    timer1Sequence(timer1);
                }
            } else {
                // If not paused, start with Timer 1
                timer1Sequence(timer1);
            }
        }

        function timer1Sequence(timer1) {
            runTimer("Timer 1", timer1, () => {
                if (running && timer1 > 0) {
                    playAlarm(() => {
                        timer2Sequence(programs[currentProgram].timer2);
                    });
                } else if (running) {
                    timer2Sequence(programs[currentProgram].timer2);
                }
            });
        }

        function timer2Sequence(timer2) {
            runTimer("Timer 2", timer2, () => {
                if (running && timer2 > 0) {
                    playAlarm(() => {
                        cycleTimers();
                    });
                } else if (running) {
                    cycleTimers();
                }
            });
        }

        function runTimer(timerName, seconds, callback) {
            if (!running) {
                tickSound.pause();
                callback();
                return;
            }

            lastTimer = timerName; // Store the active timer
            currentTimer = timerName;
            remainingTime = seconds;
            updateCountdownCircle(seconds);
            tickSound.pause();

            if (!paused) 
                tickSound.currentTime = 0;
            
            if (seconds > 0)
                tickSound.play();
                
            document.getElementById('status').innerText = `${timerName}: running`;

            let countdown = setInterval(() => {
                if (!running) {
                    clearInterval(countdown);
                    tickSound.pause();
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
                    tickSound.pause();
                    updateCountdownCircle("");

                    if (timerName === "Timer 1") {
                        remainingTime1 = 0;
                    } else if (timerName === "Timer 2") {
                        remainingTime2 = 0;
                    }

                    // Play alarm here, *before* calling the callback, ONLY if timer was paused
                    if (paused) { // only play alarm if timer was paused.
                        if (running) { //Ensure we should still be playing.
                            playAlarm(callback);
                        } else {
                            callback();
                        }
                    } else {
                        callback(); // Just call the callback if the timer wasn't paused.
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

        function updateCountdownCircle(seconds) {
            countdownCircle.textContent = seconds;
        }