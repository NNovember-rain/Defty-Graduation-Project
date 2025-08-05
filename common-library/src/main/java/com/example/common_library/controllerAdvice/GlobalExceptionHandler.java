package com.example.common_library.controllerAdvice;



import com.example.common_library.dto.response.ErrorResponse;
import com.example.common_library.exceptions.FieldRequiredException;
import com.example.common_library.exceptions.JsonHandlerException;
import com.example.common_library.exceptions.MediaUploadException;
import com.example.common_library.exceptions.NotFoundException;
import org.hibernate.exception.ConstraintViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.MissingServletRequestParameterException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.context.request.WebRequest;

import java.util.ArrayList;
import java.util.Date;
import java.util.List;

import static org.springframework.http.HttpStatus.*;
@RestControllerAdvice
public class GlobalExceptionHandler {

//    @ExceptionHandler({ConstraintViolationException.class,
//            MissingServletRequestParameterException.class, MethodArgumentNotValidException.class})
//    @ResponseStatus(BAD_REQUEST)
//    public ErrorResponse handleValidationException(Exception e, WebRequest request) {
//        ErrorResponse errorResponse = new ErrorResponse();
//        errorResponse.setTimestamp(new Date());
//        errorResponse.setStatus(BAD_REQUEST.value());
//        errorResponse.setPath(request.getDescription(false).replace("uri=", ""));
//
//        String message = e.getMessage();
//        if (e instanceof MethodArgumentNotValidException) {
//            int start = message.lastIndexOf("[") + 1;
//            int end = message.lastIndexOf("]") - 1;
//            message = message.substring(start, end);
//            errorResponse.setError("Invalid Payload");
//            errorResponse.setMessage(message);
//        } else if (e instanceof MissingServletRequestParameterException) {
//            errorResponse.setError("Invalid Parameter");
//            errorResponse.setMessage(message);
//        } else if (e instanceof ConstraintViolationException) {
//            errorResponse.setError("Invalid Parameter");
//            errorResponse.setMessage(message.substring(message.indexOf(" ") + 1));
//        } else {
//            errorResponse.setError("Invalid Data");
//            errorResponse.setMessage(message);
//        }
//
//        return errorResponse;
//    }


//    @ExceptionHandler({IllegalArgumentException.class, RuntimeException.class})
//    @ResponseStatus(OK)
//    public ErrorResponse handleIllegalArgumentException(Exception e, WebRequest request) {
//        ErrorResponse errorResponse = new ErrorResponse();
//        errorResponse.setTimestamp(new Date());
//        errorResponse.setPath(request.getDescription(false).replace("uri=", ""));
//        errorResponse.setStatus(BAD_REQUEST.value());
//        errorResponse.setError("Bad Request");
//        errorResponse.setMessage(e.getMessage());
//        return errorResponse;
//    }


//    @ExceptionHandler(NullPointerException.class)
//    @ResponseStatus(INTERNAL_SERVER_ERROR)
//    public ErrorResponse handleNullPointerException(NullPointerException e, WebRequest request) {
//        ErrorResponse errorResponse = new ErrorResponse();
//        errorResponse.setTimestamp(new Date());
//        errorResponse.setPath(request.getDescription(false).replace("uri=", ""));
//        errorResponse.setStatus(INTERNAL_SERVER_ERROR.value());
//        errorResponse.setError("Null Pointer Exception");
//        errorResponse.setMessage("A null value was encountered where it shouldn't have been.");
//        return errorResponse;
//    }
//
//    @ExceptionHandler({Exception.class, JsonHandlerException.class})
//    @ResponseStatus(INTERNAL_SERVER_ERROR)
//    public ErrorResponse handleGeneralException(Exception e, WebRequest request) {
//        ErrorResponse errorResponse = new ErrorResponse();
//        errorResponse.setTimestamp(new Date());
//        errorResponse.setPath(request.getDescription(false).replace("uri=", ""));
//        errorResponse.setStatus(INTERNAL_SERVER_ERROR.value());
//        errorResponse.setError("Internal Server Error");
//        errorResponse.setMessage(e.getMessage());
//
//        return errorResponse;
//    }

    @ExceptionHandler(FieldRequiredException.class)
    @ResponseStatus(OK)
    public ErrorResponse handleFieldRequiredException(FieldRequiredException e, WebRequest request) {
        ErrorResponse errorResponseDTO = new ErrorResponse();
        errorResponseDTO.setTimestamp(new Date());
        errorResponseDTO.setPath(request.getDescription(false).replace("uri=", ""));
        errorResponseDTO.setStatus(HttpStatus.BAD_REQUEST.value());
        String[] message = e.getMessage().split("!");
        errorResponseDTO.setError(message[0]);
        List<String> detailMessage = new ArrayList<>();
        for(int i = 1; i < message.length; i++){
            detailMessage.add(message[i]);
            System.out.println(message[i]);
        }
        errorResponseDTO.setDetailMessage(detailMessage);
        return errorResponseDTO;
    }

    @ExceptionHandler(NotFoundException.class)
    @ResponseStatus(OK)
    public ErrorResponse handleNotFoundException(NotFoundException e, WebRequest request) {
        ErrorResponse errorResponseDTO = new ErrorResponse();
        errorResponseDTO.setTimestamp(new Date());
        errorResponseDTO.setPath(request.getDescription(false).replace("uri=", ""));
        errorResponseDTO.setStatus(HttpStatus.NOT_FOUND.value());
        errorResponseDTO.setError(e.getMessage());
        List<String> detailMessage = new ArrayList<>();
        detailMessage.add("No records found");
        errorResponseDTO.setDetailMessage(detailMessage);
        return errorResponseDTO;
    }

//    @ExceptionHandler(MediaUploadException.class)
//    @ResponseStatus(HttpStatus.OK)
//    public ErrorResponse handleImageUploadException(MediaUploadException e, WebRequest request) {
//        ErrorResponse errorResponse = new ErrorResponse();
//        errorResponse.setTimestamp(new Date());
//        errorResponse.setPath(request.getDescription(false).replace("uri=", ""));
//        errorResponse.setStatus(HttpStatus.BAD_REQUEST.value());
//        errorResponse.setError("Image Upload Error");
//        errorResponse.setMessage(e.getMessage());
//        return errorResponse;
//    }



    //TODO: thầy Hạnh viết
//    @ExceptionHandler(UnauthorizedException.class)
//    @ResponseStatus(UNAUTHORIZED)
//    public ErrorResponse handleUnauthorizedException(UnauthorizedException e, WebRequest request) {
//        ErrorResponse errorResponse = new ErrorResponse();
//        errorResponse.setTimestamp(new Date());
//        errorResponse.setPath(request.getDescription(false).replace("uri=", ""));
//        errorResponse.setStatus(UNAUTHORIZED.value());
//        errorResponse.setError("Unauthorized");
//        errorResponse.setMessage(e.getMessage());
//
//        return errorResponse;
//    }
}
