# Libraries
import msgpack
import RPi.GPIO as GPIO
import os
import time
import socket
import threading
from random import *

# GPIO Mode (BOARD / BCM)
GPIO.setmode(GPIO.BCM)

# set GPIO Pins
pin23 = 23 # GPIO23 on the Pi
pin24 = 24 # GPIO24 on the Pi
pin25 = 25 # GPIO25 on the Pi

# set GPIO direction (IN / OUT)
GPIO.setup(pin23, GPIO.IN)
GPIO.setup(pin24, GPIO.IN)
GPIO.setup(pin25, GPIO.IN)

def dataSend():
    HOST = "127.0.0.1"
    PORT = 9000

    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as sock:
        sock.connect((HOST, PORT)) # connect to server
        r = 0
        g = 0
        b = 0
        x = 0
        y = 0
        while True:
            r = randint(0, 255) # generate a random number in range 0-255 representing rgb value
            g = randint(0, 255)
            b = randint(0, 255)
            x = randint(0, 2000) # generate random number to represent x coordinate of particle
            y = randint(0, 900) # generate random number to represent y coordinate of particle

            # assign pin inputs to their respective button readings
            pausePlayButton = GPIO.input(pin23)
            clearButton = GPIO.input(pin24)
            screenshotButton = GPIO.input(pin25)

            someArr = [r, g, b, x, y, pausePlayButton, clearButton, screenshotButton]
            bts = msgpack.packb(someArr)
            sock.sendall(bts)
            time.sleep(0.03) # delay in sending data on TCP socket

if __name__ == "__main__":
    print("Running...")

    p1 = threading.Thread(target=dataSend, daemon=True)
    p1.start()

    try:
        p1.join()
    except KeyboardInterrupt:
        GPIO.cleanup()
        print("Exiting Python gracefully?")