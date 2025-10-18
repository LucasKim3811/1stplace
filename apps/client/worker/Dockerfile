# Worker image with Python + EDA tools (Yosys/Verilator/OpenSTA)
FROM ubuntu:22.04

ENV DEBIAN_FRONTEND=noninteractive
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential git make cmake curl ca-certificates pkg-config \
    python3 python3-pip python3-venv \
    tcl tk \
    yosys verilator opensta iverilog \
    && rm -rf /var/lib/apt/lists/*

RUN pip3 install --no-cache-dir \
    requests jinja2 vcdvcd unidiff pytest

WORKDIR /app
COPY . /app

# A place to stage per-job workdirs
RUN mkdir -p /data/jobs
ENV DATA_ROOT=/data/jobs

CMD ["python3", "worker.py"]
