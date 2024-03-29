"""
Specific queries to the Wolfram results API and a generic ask() function to invoke the API
"""
import json
import logging
from json import JSONDecodeError

import requests

from custom_exceptions import APIError
from secrets import Secrets

logger = logging.getLogger('rm_web_app')


class WolframClient:
    """
    Operations against the Wolfram API
    """

    @staticmethod
    def ask(query: str, include_pod: str = None) -> str:
        """
        Invoke the Wolfram Alpha Results API which will allow us to perform various mathematical calculations to
        cross-check our results. Refer to https://products.wolframalpha.com/api/documentation for usage.
        :return: result of wolfram query in JSON
        """
        params = {"appid": Secrets.WolframAppId,
                  "input": query,
                  "output": "json",
                  "format": 'plaintext,moutput'}
        if include_pod is not None:
            params["includepodid"] = include_pod
        try:
            # for now we only need the Limit pod, but when add further calculations we will need to specify those pods
            # we are also only asking for plaintext and moutput because by default there is also additional output such
            # as a plot image url, but we are plotting in the frontend
            result = requests.get("https://api.wolframalpha.com/v2/query",
                                  params)
        except Exception as e:
            logger.error("Wolfram API returned error", e)
        else:
            try:
                result = json.loads(result.content)
                try:
                    raise APIError(result["queryresult"]["error"]["msg"])
                except (AttributeError, TypeError):
                    # if the key does not exist or is false then the api call was successful
                    pass
                return result
            except JSONDecodeError as e:
                logger.error("Failed to parse Wolfram API result", e)

    @staticmethod
    def limit(expression: str) -> str:
        """
        Query the Wolfram results API for limits of a string expression
        :param expression: Mathematical expression for which we would like to compute the limit(s)
        :return: Wolfram API response "subpods" with the computed limit(s)
        """
        try:
            result = WolframClient.ask(query="limit of {}".format(expression), include_pod="Limit")
            # only want to return: queryresult -> pods[0] -> subpods
            return result["queryresult"]["pods"][0]["subpods"]
        except Exception as e:
            logger.error("Failed to obtain Wolfram API result", e)

    @staticmethod
    def closed_form(expression: str) -> str:
        """
        Query the Wolfram results API for limits of a string expression
        :param expression: Mathematical expression for which we would like to compute the limit(s)
        :return: Wolfram API response "subpods" with the computed limit(s)
        """
        try:
            result = WolframClient.ask(query=expression, include_pod="PossibleClosedForm")
            # only want to return: queryresult -> pods[0] -> subpods
            return result["queryresult"]["pods"][0]["subpods"]
        except Exception as e:
            logger.error("Failed to obtain Wolfram API result", e)

    @staticmethod
    def raw(expression: str) -> str:
        """
        Query the Wolfram results API with a string expression
        :param expression: Mathematical expression for which we would like to get more information
        :return: Wolfram API response
        """
        try:
            result = WolframClient.ask(query=f"{expression}")
            # just pass the result through
            return result["queryresult"]
        except Exception as e:
            logger.error("Failed to obtain Wolfram API result", e)

    @staticmethod
    def continued_fraction(expression: str) -> str:
        """
        Query the Wolfram results API for the continued fraction form of an expression
        :param expression: Mathematical expression for which we would like to retrieve the continued fraction form
        :return: Wolfram API response "subpods" with the continued fraction form of the expression
        """
        try:
            result = WolframClient.ask(query="continued fraction representation of {}".format(expression))
            # only want to return: queryresult -> pods[0] -> subpods
            return result["queryresult"]["pods"][0]["subpods"]
        except Exception as e:
            logger.error("Failed to obtain Wolfram API result", e)
