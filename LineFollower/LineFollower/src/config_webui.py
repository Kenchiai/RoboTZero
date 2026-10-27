import json
import math
import re
import webbrowser
from dataclasses import dataclass
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from typing import Any


@dataclass(frozen=True)
class ConfigParameter:
    name: str
    label: str
    category: str
    description: str
    min_value: int | float
    max_value: int | float
    default: int | float


PARAMETERS = (
    ConfigParameter("VELOCIDADE_1", "Velocidade inicial", "Velocidades", "Velocidade inicial do robô. Aumente se o robô não iniciar movimento.", 25, 75, 60),
    ConfigParameter("VELOCIDADE_2", "Velocidade em curvas suaves", "Velocidades", "Velocidade para curvas suaves. Ajuste para melhor desempenho em curvas graduais.", 75, 125, 100),
    ConfigParameter("VELOCIDADE_3", "Velocidade de frenagem", "Velocidades", "Velocidade de frenagem. Aumente se o robô parar muito bruscamente.", 120, 160, 140),
    ConfigParameter("VELOCIDADE_4", "Velocidade média", "Velocidades", "Velocidade média para retas. Ajuste conforme as características da pista.", 150, 190, 170),
    ConfigParameter("VELOCIDADE_5", "Modo lento", "Velocidades", "Velocidade do modo lento. Aumente se o robô estiver muito lento.", 170, 220, 200),
    ConfigParameter("ACEL_STEP", "Passo de aceleração", "Controle", "Aumente para uma saída mais rápida de curvas.", 20, 40, 25),
    ConfigParameter("FREIO_STEP", "Passo de frenagem", "Controle", "Aumente para uma frenagem mais forte nas curvas.", 30, 50, 35),
    ConfigParameter("CURVA_VEL", "Velocidade em curvas", "Controle", "Diminua se o robô derrapar nas curvas.", 100, 140, 120),
    ConfigParameter("CURVA_ERRO", "Limiar de curva", "Controle", "Aumente se as curvas forem detectadas muito cedo.", 40, 60, 45),
    ConfigParameter("KPROP_DEFAULT", "Ganho proporcional", "PID", "Aumente para uma correção mais agressiva.", 5.0, 9.0, 7.0),
    ConfigParameter("KDERIV_DEFAULT", "Ganho derivativo", "PID", "Diminua se o robô oscilar muito nas retas.", 200.0, 400.0, 300.0),
    ConfigParameter("ALPHA_DEFAULT", "Fator de suavização", "PID", "Aumente para uma resposta mais rápida do filtro.", 0.6, 0.9, 0.7),
    ConfigParameter("SENSOR_THRESHOLD", "Limiar dos sensores", "Sensores", "Aumente se os sensores não detectarem a linha adequadamente.", 100, 150, 120),
    ConfigParameter("PESO_S1", "Peso do sensor esquerdo", "Sensores", "Peso do sensor extremo esquerdo. Ajuste a intensidade da correção.", -1.8, -1.2, -1.5),
    ConfigParameter("PESO_S6", "Peso do sensor direito", "Sensores", "Peso do sensor extremo direito. Ajuste a intensidade da correção.", 1.2, 1.8, 1.5),
)

CONFIG_PATH = Path(__file__).with_name("config.h")
PAGE_PATH = Path(__file__).with_name("config_webui.html")
NUMBER_PATTERN = re.compile(r"[-+]?(?:\d+(?:\.\d*)?|\.\d+)(?:[fF])?")


def parse_config(content: str) -> dict[str, int | float]:
    values: dict[str, int | float] = {}
    for parameter in PARAMETERS:
        pattern = re.compile(
            rf"(?m)^\s*#define\s+{re.escape(parameter.name)}\s+({NUMBER_PATTERN.pattern})"
        )
        match = pattern.search(content)
        if match:
            number = match.group(1).rstrip("fF")
            values[parameter.name] = float(number) if "." in number else int(number)
    return values


def read_config() -> dict[str, int | float]:
    values = parse_config(CONFIG_PATH.read_text(encoding="utf-8"))
    missing = [parameter.name for parameter in PARAMETERS if parameter.name not in values]
    if missing:
        raise ValueError(f"Parâmetros não encontrados em config.h: {', '.join(missing)}")
    return values


def save_config(values: dict[str, Any]) -> None:
    current_values = read_config()
    content = CONFIG_PATH.read_text(encoding="utf-8")

    for parameter in PARAMETERS:
        name = parameter.name
        try:
            value = float(values[name])
        except (KeyError, TypeError, ValueError) as error:
            raise ValueError(f"Valor inválido para {name}.") from error

        if not math.isfinite(value):
            raise ValueError(f"Valor inválido para {name}.")
        if value < parameter.min_value or value > parameter.max_value:
            if value != current_values[name]:
                raise ValueError(
                    f"{name} deve estar entre {parameter.min_value} e {parameter.max_value}."
                )
        if isinstance(parameter.default, int) and not value.is_integer():
            raise ValueError(f"{name} deve ser um número inteiro.")

        formatted = str(int(value)) if isinstance(parameter.default, int) else str(value)
        pattern = re.compile(
            rf"(?m)^(\s*#define\s+{re.escape(name)}\s+)({NUMBER_PATTERN.pattern})"
        )

        def replace_value(match: re.Match[str]) -> str:
            suffix = "f" if match.group(2).endswith(("f", "F")) else ""
            return f"{match.group(1)}{formatted}{suffix}"

        content, count = pattern.subn(replace_value, content, count=1)
        if count != 1:
            raise ValueError(f"Não foi possível atualizar {name} em config.h.")

    CONFIG_PATH.write_text(content, encoding="utf-8")


class ConfigRequestHandler(BaseHTTPRequestHandler):
    def do_GET(self) -> None:
        if self.path == "/":
            self._send(200, PAGE_PATH.read_bytes(), "text/html; charset=utf-8")
            return
        if self.path == "/api/config":
            parameters = [parameter.__dict__ for parameter in PARAMETERS]
            self._send_json(200, {"values": read_config(), "parameters": parameters})
            return
        self._send_json(404, {"error": "Rota não encontrada."})

    def do_POST(self) -> None:
        if self.path == "/api/save":
            try:
                payload = self._read_json()
                save_config(payload.get("values", {}))
                self._send_json(200, {"values": read_config(), "message": "Configuração salva."})
            except (OSError, ValueError, json.JSONDecodeError) as error:
                self._send_json(400, {"error": str(error)})
            return
        self._send_json(404, {"error": "Rota não encontrada."})

    def _read_json(self) -> dict[str, Any]:
        length = int(self.headers.get("Content-Length", "0"))
        if length > 16_384:
            raise ValueError("Requisição muito grande.")
        payload = json.loads(self.rfile.read(length))
        if not isinstance(payload, dict):
            raise ValueError("Formato de requisição inválido.")
        return payload

    def _send_json(self, status: int, payload: dict[str, Any]) -> None:
        self._send(status, json.dumps(payload).encode("utf-8"), "application/json; charset=utf-8")

    def _send(self, status: int, body: bytes, content_type: str) -> None:
        self.send_response(status)
        self.send_header("Content-Type", content_type)
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(body)

    def log_message(self, format_string: str, *args: Any) -> None:
        print(f"[WebUI] {format_string % args}")


def main() -> None:
    server = ThreadingHTTPServer(("127.0.0.1", 0), ConfigRequestHandler)
    address, port = server.server_address
    url = f"http://{address}:{port}/"
    print(f"WebUI disponível em {url}. Pressione Ctrl+C para encerrar.")
    webbrowser.open(url)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nWebUI encerrada.")
    finally:
        server.server_close()


if __name__ == "__main__":
    main()