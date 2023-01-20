import msgpack
import os
import time
import socket
from random import *

if __name__ == "__main__":
    print("Running...")

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
            someArr = [r, g, b, x, y]
            bts = msgpack.packb(someArr)
            sock.sendall(bts)
            print(bts)
            time.sleep(0.05) # delay in sending data on TCP socket

    pass


