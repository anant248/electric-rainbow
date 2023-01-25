import msgpack
import os
import time
import socket
import threading
from random import *

pausePlayButton = 1 # 0 means play, 1 means pause
clearButton = 1 # 1 means clear

def clearCanvas():
    global clearButton

    while True:
        if (clearButton == 1): 
            clearButton = 0
        else:
            clearButton = 1
            time.sleep(0.10)
            clearButton = 0

        print(clearButton)
        time.sleep(3)

def buttonSwitch():
    global pausePlayButton

    while True:
        if (pausePlayButton == 1): 
            pausePlayButton = 0
        else:
            pausePlayButton = 1

        print(pausePlayButton)
        time.sleep(10)

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
            someArr = [r, g, b, x, y, pausePlayButton, clearButton]
            bts = msgpack.packb(someArr)
            sock.sendall(bts)
            print(bts)
            time.sleep(0.03) # delay in sending data on TCP socket

if __name__ == "__main__":
    print("Running...")

    p1 = threading.Thread(target=buttonSwitch)
    p1.start()

    p2 = threading.Thread(target=dataSend)
    p2.start()

    p3 = threading.Thread(target=clearCanvas)
    p3.start()

    p1.join()
    p2.join()
    p3.join()