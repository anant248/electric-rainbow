import msgpack
import os
import time

if __name__ == "__main__":
    print("Running...")

    i=0
    while True:
        i+=1
        bts = msgpack.packb(i)
        with open(os.path.join(os.getcwd(), "comms"), 'wb') as f:
            f.write(bts)
            print(bts)

        time.sleep(1)

    pass


