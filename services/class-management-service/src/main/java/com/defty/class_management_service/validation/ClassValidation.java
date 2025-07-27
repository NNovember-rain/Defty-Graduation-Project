package com.defty.class_management_service.validation;

import com.defty.class_management_service.dto.request.ClassRequest;
import com.example.common_library.exceptions.FieldRequiredException;
import org.springframework.stereotype.Component;

@Component
public class ClassValidation {
    public void fieldValidation(ClassRequest classRequest){
        String message = "";
        if(checknull(classRequest.getName())) message += "Class name can't be left blank!";
        if(checknull(classRequest.getName())){
            message = "Field Riquired Exception!" + message;
            throw new FieldRequiredException(message);
        }
    }

    boolean checknull(String s){
        if(s == null || s.trim().equals("")) return true;
        return false;
    }
}
