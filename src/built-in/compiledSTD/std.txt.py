###############################
# START OF ENTROPY SCRIPT STD #
###############################
import time

log = print
parseNum = float

def help(thing):
    return 'Help is not available in ES compiled Python'


def GENERATE_PRIVATE():
    return {
        'modules': {
            'ascii': {

            },
            'time': {
                'now': lambda : time.time_ns() / (10 ** 6)
            }
        }
    }

PRIVATE = GENERATE_PRIVATE()

def import_ (path):
    if path in PRIVATE['modules']:
        return PRIVATE['modules'][path]


#############################
# END OF ENTROPY SCRIPT STD #
#############################