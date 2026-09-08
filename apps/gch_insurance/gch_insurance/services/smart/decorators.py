from functools import wraps

def login_required(func):
    @wraps(func)
    def func_wrapper(self, *args, **kwargs):
        if not self.token:
            self.login()
        return func(self, *args, **kwargs)

    return func_wrapper
