import msgpack
import os
import time
import socket

if __name__ == "__main__":
    print("Running...")

    HOST = "127.0.0.1"
    PORT = 9000

    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as sock:
        sock.connect((HOST, PORT)) # connect to server

        i=0
        while True:
            i+=1
            someArr = [i, i+1, i+2, i+3, i+4, i+5, i+6, i+7]
            bts = msgpack.packb(someArr)
            sock.sendall(bts)
            print(bts)
            time.sleep(0.0001)

    pass


