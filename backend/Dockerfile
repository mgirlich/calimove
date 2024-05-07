# could also try alpine
FROM python:3.12-slim

# https://stackoverflow.com/questions/59812009/what-is-the-use-of-pythonunbuffered-in-docker-file
# ensures that the python output i.e. the stdout and stderr streams are sent straight to terminal (e.g. your container log) without being first buffered and that you can see the output of your application (e.g. django logs) in real time.
ENV PYTHONUNBUFFERED 1
# Disabling Bytecode (.pyc) Files¶
# https://python-docs.readthedocs.io/en/latest/writing/gotchas.html#disabling-bytecode-pyc-files
ENV PYTHONDONTWRITEBYTECODE 1

# Set python paths?
# ENV PATH="${PATH}:/root/.local/bin"
# ENV PYTHONPATH=.

# Expose the port 8000 in which our application runs
EXPOSE 8000

# set work directory
WORKDIR  /app

# Copy requirements from host, to docker container in /app 
COPY ./requirements.txt .

# add “--no-cache-dir” as argument to avoid unnecessary creation of temp files to reduce the size of the docker image.
RUN pip3 install --upgrade pip
RUN pip3 install --no-cache-dir -r /app/requirements.txt

# Copy everything from ./calimove
COPY ./calimove ./calimove

# Run the application in the port 8000
CMD ["uvicorn", "--host", "0.0.0.0", "--port", "8000", "calimove.app:app", "--reload"]